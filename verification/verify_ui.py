from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:3000")

            # Wait for the main elements to load
            page.wait_for_selector("text=Best-of-N Jailbreaking Prompt Generator", timeout=60000)

            # Verify new visual elements
            # 1. Steering Wheel components
            # We look for the text labels.
            if page.is_visible("text=Server"):
                print("Element 'Server' found.")
            if page.is_visible("text=Client"):
                 print("Element 'Client' found.")
            if page.is_visible("text=LM Studio"):
                 print("Element 'LM Studio' found.")

            # 2. Connection Status
            # It starts as "Unknown" then "Checking..." then "Disconnected" (since no local LLM).
            # We'll wait for any of these.
            page.wait_for_selector("text=Disconnected", timeout=10000)
            print("Connection status 'Disconnected' confirmed.")

            # 3. Log Stream Header
            if page.is_visible("text=Log Stream"):
                print("Log Stream header found.")

            # Take screenshot
            page.screenshot(path="verification/frontend_dashboard_styled.png")
            print("Screenshot taken: verification/frontend_dashboard_styled.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_retry.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
