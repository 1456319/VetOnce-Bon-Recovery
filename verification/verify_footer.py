from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000")

        # Check footer text
        footer = page.locator("footer")
        expect(footer).to_contain_text("bestofn.1456319.com")
        expect(footer).to_contain_text("2025")
        expect(footer).not_to_contain_text("VetOnce")

        # Check title in body (just to be sure page loaded)
        expect(page.locator("h1")).to_contain_text("Best-of-N Jailbreaking Prompt Generator")

        page.screenshot(path="verification/footer_check_full.png", full_page=True)
        print("Verification successful, screenshot saved.")
        browser.close()

if __name__ == "__main__":
    run()
