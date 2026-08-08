import asyncio
from playwright.async_api import async_playwright

IPHONE = {"width": 390, "height": 844}
UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--no-sandbox"])
        ctx = await browser.new_context(viewport=IPHONE, user_agent=UA, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        await page.goto("https://www.jazeeraairways.com/en-kw/flight-search?openFrom=true", wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(6000)
        await page.screenshot(path="/home/ubuntu/mob_orig_picker.png", full_page=False)
        print("saved orig picker")
        await ctx.close()
        await browser.close()

asyncio.run(main())
