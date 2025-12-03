from playwright.sync_api import sync_playwright

def verify_feature(page):
    page.goto('http://localhost:3000')

    # Check if Generation Mode switches exist
    page.wait_for_selector('label[for="mode-short"]')
    page.wait_for_selector('label[for="mode-long"]')

    # Check if Detailed Results table exists (or container for it)
    # The table only appears after results, but we can check if the components rendered correctly.
    # We will simulate a state where results might appear if we could mock, but here we just check static elements.

    page.screenshot(path='verification/verification.png')
    print("Screenshot taken.")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    verify_feature(page)
    browser.close()
