from playwright.sync_api import Page, expect

def test_light_mode(page: Page):
    """
    This test verifies that the light mode is applied correctly.
    """
    # 1. Arrange: Go to the index.html file.
    page.goto("file:///app/frontend/build/index.html")

    # 2. Assert: Confirm the body has the light background color.
    body = page.locator("body")
    expect(body).to_have_css("background-color", "rgb(249, 250, 251)") # Corresponds to bg-light (Gray 50)

    # 3. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")
