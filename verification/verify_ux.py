from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to http://localhost:3000...")
            page.goto("http://localhost:3000", timeout=60000)

            # Wait for the "Steering Wheel" pipeline to be visible
            print("Waiting for Pipeline Status...")
            page.wait_for_selector("text=Pipeline Status", timeout=30000)

            # Check for the connection indicator (Red or Yellow initially)
            print("Checking for connection indicator...")
            # We expect a yellow or red dot depending on if LM Studio is running.
            # Since we are in sandbox, it's likely not running, so red or unknown.
            # The code has a tooltip.

            # Check for "Server (Engine)" text
            print("Verifying 'Server (Engine)' text...")
            if not page.get_by_text("Server (Engine)").is_visible():
                print("Error: 'Server (Engine)' not found.")

            # Check for "Client (Bridge)" text
            print("Verifying 'Client (Bridge)' text...")
            if not page.get_by_text("Client (Bridge)").is_visible():
                 print("Error: 'Client (Bridge)' not found.")

            # Check for "LM Studio (GPU)" text
            print("Verifying 'LM Studio (GPU)' text...")
            if not page.get_by_text("LM Studio (GPU)").is_visible():
                 print("Error: 'LM Studio (GPU)' not found.")

            # Take a screenshot
            screenshot_path = "verification/frontend_ux.png"
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
