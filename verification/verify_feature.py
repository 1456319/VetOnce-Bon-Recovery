from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock APIs
        # Mock /api/models to return a Qwen3 model
        page.route("**/api/models", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"path": "Qwen/Qwen3-7B-Instruct", "isLoaded": false}, {"path": "OtherModel", "isLoaded": false}]'
        ))

        # Mock /api/lmstudio/loaded to return empty list initially
        page.route("**/api/lmstudio/loaded", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        # Mock LM Studio connection check (so Generate button is enabled)
        page.route("**/v1/models", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"data": []}'
        ))

        print("Navigating to home page...")
        page.goto("http://localhost:3000")

        page.wait_for_selector("button#model-select")

        # Check if checkbox is visible
        try:
            page.wait_for_selector("label:has-text('Enable Thinking')", timeout=2000)
            print("Checkbox is visible immediately (default selection works).")
        except:
            print("Checkbox not visible, attempting to select model...")
            page.click("button#model-select")
            page.click("div[role='option']:has-text('Qwen')")
            page.wait_for_selector("label:has-text('Enable Thinking')")

        # Toggle it
        page.click("label:has-text('Enable Thinking')")
        page.screenshot(path="verification/step1_thinking_enabled.png")

        # Test Simultaneous Loading Block
        # Mock loaded model to be 'OtherModel'
        page.route("**/api/lmstudio/loaded", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"path": "OtherModel", "identifier": "OtherModel"}]'
        ))

        print("Testing blocking...")
        page.fill("textarea[name='prompt']", "Test prompt")

        # Click Generate
        print("Clicking Generate...")
        page.click("button:has-text('Generate')")

        try:
            print("Waiting for error indicator...")
            # The button appears if errorLog.length > 0
            page.wait_for_selector("button:has(svg.lucide-alert-circle)", timeout=5000)

            print("Error indicator found. Clicking it...")
            page.click("button:has(svg.lucide-alert-circle)")

            print("Waiting for error message text...")
            page.wait_for_selector("text=is already loaded", timeout=5000)
            print("Error message validated.")

            page.screenshot(path="verification/step2_error_shown.png")
        except Exception as e:
            print(f"Failed to find error log: {e}")
            page.screenshot(path="verification/step2_failed.png")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
