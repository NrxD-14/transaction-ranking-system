import os
from playwright.sync_api import sync_playwright
import time
import imageio.v2 as imageio
from PIL import Image

def run():
    # Make sure we have docs/images/
    os.makedirs('docs/images', exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a 1440x900 viewport
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # Helper to wait for network idle
        def wait_load():
            try:
                page.wait_for_load_state("networkidle", timeout=5000)
            except:
                pass
            time.sleep(1) # Extra stability

        base_url = "http://localhost:5173"
        gif_frames = []

        def capture_frame():
            path = "temp_frame.png"
            page.screenshot(path=path)
            gif_frames.append(imageio.imread(path))
            
        print("Capturing Login Page...")
        page.goto(f"{base_url}/login")
        wait_load()
        page.screenshot(path="docs/images/login.png")
        capture_frame()

        print("Capturing Evaluation Access Expanded...")
        try:
            eval_button = page.locator("text='Evaluation Access'")
            if eval_button.is_visible():
                eval_button.click()
                time.sleep(0.5)
            page.screenshot(path="docs/images/evaluation-access.png")
        except Exception as e:
            print(f"Eval access button not found: {e}")

        # Login using the eval credentials
        print("Logging in...")
        try:
            # Reveal admin credentials via eval code
            eval_code_input = page.locator("input[placeholder*='Code']")
            if eval_code_input.count() > 0:
                eval_code_input.fill("DEVN1427")
                page.keyboard.press("Enter")
                time.sleep(1)
            
            # The login credentials will be pre-filled or we can fill them
            email_input = page.locator("input[type='email']")
            if email_input.count() > 0:
                email_input.fill("admin@trs.com") # Based on common default, if pre-filled this overrides
            page.locator("input[type='password']").fill("admin123")
            page.click("button[type='submit']")
            wait_load()
            capture_frame()
        except Exception as e:
            print(f"Login failed: {e}")

        print("Capturing Admin Dashboard...")
        page.goto(f"{base_url}/admin/dashboard")
        wait_load()
        page.screenshot(path="docs/images/admin-dashboard.png")
        capture_frame()

        print("Capturing Admin Users...")
        page.goto(f"{base_url}/admin/users")
        wait_load()
        page.screenshot(path="docs/images/admin-users.png")

        print("Capturing Admin Analytics...")
        page.goto(f"{base_url}/admin/analytics")
        wait_load()
        page.screenshot(path="docs/images/admin-analytics.png")

        print("Capturing Admin Transactions...")
        page.goto(f"{base_url}/admin/transactions")
        wait_load()
        page.screenshot(path="docs/images/admin-transactions.png")
        
        print("Capturing Settings...")
        page.goto(f"{base_url}/settings")
        wait_load()
        page.screenshot(path="docs/images/settings.png")

        print("Capturing Dark Theme...")
        try:
            # Just toggle if there's a button with 'theme' in arialabel
            theme_btn = page.locator("button[aria-label*='theme' i]")
            if theme_btn.count() > 0:
                theme_btn.first.click()
                time.sleep(1)
                page.screenshot(path="docs/images/dark-theme.png")
                # toggle back
                theme_btn.first.click()
                time.sleep(1)
        except Exception as e:
            print(f"Theme toggle failed: {e}")
        
        # We need to capture regular user pages
        print("Capturing User Dashboard...")
        page.goto(f"{base_url}/dashboard")
        wait_load()
        page.screenshot(path="docs/images/dashboard.png")
        capture_frame()

        print("Capturing New Transaction Page...")
        page.goto(f"{base_url}/transaction")
        wait_load()
        page.screenshot(path="docs/images/new-transaction.png")
        capture_frame()

        print("Capturing Leaderboard...")
        page.goto(f"{base_url}/leaderboard")
        wait_load()
        page.screenshot(path="docs/images/leaderboard.png")
        capture_frame()

        print("Capturing User Summary...")
        page.goto(f"{base_url}/summary")
        wait_load()
        page.screenshot(path="docs/images/user-summary.png")

        print("Capturing Transaction History...")
        page.goto(f"{base_url}/transactions")
        wait_load()
        page.screenshot(path="docs/images/transaction-history.png")

        print("Capturing Swagger API Documentation...")
        page.goto("http://localhost:8000/docs")
        wait_load()
        page.screenshot(path="docs/images/swagger.png")
        
        print("Saving Demo GIF...")
        if len(gif_frames) > 0:
            imageio.mimsave('docs/images/demo.gif', gif_frames, fps=1) # 1 frame per second
            if os.path.exists("temp_frame.png"):
                os.remove("temp_frame.png")

        browser.close()

if __name__ == "__main__":
    run()
