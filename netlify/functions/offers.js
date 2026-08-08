// Netlify Function: smart proxy to fetch real motor insurance offers from bima.om
// Replicates the original site's exact request sequence:
//   1) GET  /Insurance/Index                 -> capture Anti-Forgery token + session cookies
//   2) POST /Insurance/_MotorRequestForm/     -> submit vehicle data (multipart), get VehicleDataStatusCode
//   3) POST /Insurance/Index                  -> finalize step (stores vehicle data in session)
//   4) GET  /Insurance/_VehicleInsuranceOffers -> return the real offers HTML
// Bypasses browser CORS because it runs server-side.

const BASE = "https://bima.om";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// --- cookie jar helpers ---------------------------------------------------
function parseSetCookies(headers) {
  const jar = {};
  let raw = [];
  if (typeof headers.getSetCookie === "function") {
    raw = headers.getSetCookie();
  } else {
    const single = headers.get("set-cookie");
    if (single) raw = single.split(/,(?=[^;]+=[^;]+)/);
  }
  for (const c of raw) {
    const [pair] = c.split(";");
    const idx = pair.indexOf("=");
    if (idx > -1) {
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      if (name) jar[name] = value;
    }
  }
  return jar;
}

function jarToHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function mergeJar(target, incoming) {
  for (const [k, v] of Object.entries(incoming)) target[k] = v;
  return target;
}

function extractToken(html) {
  const m = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/);
  return m ? m[1] : null;
}

// extract a hidden input value by id/name from returned HTML
function extractField(html, name) {
  const re = new RegExp(
    `(?:id|name)="${name}"[^>]*value="([^"]*)"|value="([^"]*)"[^>]*(?:id|name)="${name}"`,
    "i"
  );
  const m = html.match(re);
  return m ? (m[1] !== undefined ? m[1] : m[2]) : null;
}

// build a multipart/form-data body manually (no file)
function buildMultipart(fields) {
  const boundary =
    "----bimaProxy" + Math.random().toString(16).slice(2);
  let body = "";
  for (const [k, v] of Object.entries(fields)) {
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="${k}"\r\n\r\n`;
    body += `${v == null ? "" : v}\r\n`;
  }
  body += `--${boundary}--\r\n`;
  return { boundary, body };
}

export const handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  const debug = (event.queryStringParameters || {}).debug === "1";

  try {
    // ---- incoming form data from our site ----
    let payload = {};
    if (event.body) {
      const ct = (event.headers["content-type"] || "").toLowerCase();
      if (ct.includes("application/json")) {
        payload = JSON.parse(event.body);
      } else {
        const params = new URLSearchParams(event.body);
        for (const [k, v] of params.entries()) payload[k] = v;
      }
    }

    const serviceCode =
      payload.ServiceCode ||
      (payload.CoverType === "THIRD_PARTY"
        ? "THIRD_PARTY"
        : "FULL_COMPREHENSIVE");

    const jar = {};
    const trace = [];

    // ===== Step 1: GET Index to capture token + cookies =====
    const r1 = await fetch(`${BASE}/Insurance/Index`, {
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    mergeJar(jar, parseSetCookies(r1.headers));
    const indexHtml = await r1.text();
    const token = extractToken(indexHtml);
    trace.push({ step: "GET Index", status: r1.status, token: !!token });

    if (!token) {
      return json(502, cors, { error: "token_not_found", trace });
    }

    // ===== Step 2: POST _MotorRequestForm (multipart) =====
    const mpFields = {
      ReferenceNo: payload.ReferenceNo || "",
      CivilID: payload.CivilID || "",
      CountryCode: payload.CountryCode || "968",
      ContactNo: payload.ContactNo || "",
      VehicleNo: payload.VehicleNo || "",
      VehiclePlateCharCode: payload.VehiclePlateCharCode || "",
      OTP_INPUT: payload.OTP_INPUT || "",
      OTP_SENT: payload.OTP_SENT || "",
      Submit: payload.Submit || "Next",
      LangCode: "ar",
      PolicyStatus: payload.PolicyStatus || "",
      CustomerName: payload.CustomerName || "",
      ServiceCode: serviceCode,
      __RequestVerificationToken: token,
      IsMortgage: "false",
      MortgageBankId: "",
    };
    const { boundary, body: mpBody } = buildMultipart(mpFields);

    const r2 = await fetch(`${BASE}/Insurance/_MotorRequestForm/`, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        Cookie: jarToHeader(jar),
        Referer: `${BASE}/Insurance/Index`,
        Origin: BASE,
        "X-Requested-With": "XMLHttpRequest",
      },
      body: mpBody,
    });
    mergeJar(jar, parseSetCookies(r2.headers));
    const step2Html = await r2.text();
    const statusCode = extractField(step2Html, "VehicleDataStatusCode");
    trace.push({
      step: "POST _MotorRequestForm",
      status: r2.status,
      VehicleDataStatusCode: statusCode,
      len: step2Html.length,
    });

    // If OTP is required, surface that to the frontend
    if (statusCode && /OTP_SENT|OTP_INVALID|OTP_LIMIT/.test(statusCode)) {
      return json(200, cors, {
        otpRequired: true,
        statusCode,
        message:
          statusCode === "OTP_SENT"
            ? "تم إرسال رمز تحقق (OTP) إلى هاتف مالك السيارة. أدخل الرمز للمتابعة."
            : statusCode === "OTP_INVALID"
            ? "رمز التحقق غير صحيح."
            : "تم تجاوز حد إرسال رمز التحقق، حاول لاحقاً.",
      });
    }

    // ===== Step 3: finalize -> POST Index (stores vehicle data in session) =====
    const finalBody = new URLSearchParams();
    finalBody.set("__RequestVerificationToken", token);
    finalBody.set("StepNo", "step2");
    finalBody.set("Submit", "Next");
    finalBody.set("ServiceCode", serviceCode);
    finalBody.set("ReferenceNo", payload.ReferenceNo || "");
    finalBody.set("CivilID", payload.CivilID || "");
    finalBody.set("CountryCode", payload.CountryCode || "968");
    finalBody.set("ContactNo", payload.ContactNo || "");
    finalBody.set("VehicleNo", payload.VehicleNo || "");
    finalBody.set("VehiclePlateCharCode", payload.VehiclePlateCharCode || "");
    finalBody.set("OTP_INPUT", payload.OTP_INPUT || "");
    finalBody.set("OTP_SENT", payload.OTP_SENT || "");
    finalBody.set("LangCode", "ar");
    finalBody.set("IsRenewalRequest", payload.IsRenewalRequest || "true");
    finalBody.set("IsTransferRequest", payload.IsTransferRequest || "false");
    finalBody.set("IsNewPlateRequest", payload.IsNewPlateRequest || "false");

    const r3 = await fetch(`${BASE}/Insurance/Index`, {
      method: "POST",
      redirect: "manual",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: jarToHeader(jar),
        Referer: `${BASE}/Insurance/Index`,
        Origin: BASE,
      },
      body: finalBody.toString(),
    });
    mergeJar(jar, parseSetCookies(r3.headers));
    trace.push({ step: "POST Index", status: r3.status });

    // ===== Step 4: GET the real offers partial =====
    const r4 = await fetch(
      `${BASE}/Insurance/_VehicleInsuranceOffers?refId=&offerid=`,
      {
        headers: {
          "User-Agent": UA,
          Accept: "text/html",
          Cookie: jarToHeader(jar),
          "X-Requested-With": "XMLHttpRequest",
          Referer: `${BASE}/Insurance/Index`,
        },
      }
    );
    let offersHtml = await r4.text();
    trace.push({ step: "GET _VehicleInsuranceOffers", status: r4.status, len: offersHtml.length });

    if (debug) {
      return json(200, cors, { trace, statusCode, offersPreview: offersHtml.slice(0, 800) });
    }

    // Rewrite buy buttons / offer links to our own payment page
    offersHtml = offersHtml.replace(/href="[^"]*"/gi, (m) => {
      if (/\.(css|js|png|jpg|jpeg|gif|svg|woff|ttf|ico)/i.test(m)) return m;
      return 'href="/credit-card-payment"';
    });

    return {
      statusCode: 200,
      headers: { ...cors, "Content-Type": "text/html; charset=utf-8" },
      body: offersHtml,
    };
  } catch (err) {
    return json(500, cors, { error: "proxy_failed", message: String(err) });
  }
};

function json(statusCode, cors, obj) {
  return {
    statusCode,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(obj),
  };
}
