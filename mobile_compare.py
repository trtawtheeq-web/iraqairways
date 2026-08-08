import asyncio, sys
from playwright.async_api import async_playwright

IPHONE = {"width": 390, "height": 844}
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"

async def shot(page, path):
    await page.screenshot(path=path, full_page=False)
    print("saved", path)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await browser.new_context(viewport=IPHONE, user_agent=UA, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        # OUR site home
        await page.goto("https://jazeera.pages.dev/?cb=mob1", wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(2500)
        await shot(page, "/home/ubuntu/mob_our_home.png")
        # Open From picker: click the From field
        try:
            await page.get_by_text("From", exact=False).first.click(timeout=5000)
            await page.wait_for_timeout(1500)
            await shot(page, "/home/ubuntu/mob_our_picker.png")
        except Exception as e:
            print("our picker err", e)
        await ctx.close()
        await browser.close()

asyncio.run(main())
