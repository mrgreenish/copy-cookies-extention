# Copy Cookies

Chrome extension to copy cookies from one tab and paste them into another. Useful for replicating login sessions during testing.

## Install

1. Clone this repo
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select this project folder

## Usage

1. Navigate to a tab where you're logged in
2. Click the extension icon → **Copy Cookies**
3. Open the same domain in another tab (or incognito window)
4. Click the extension icon → **Paste Cookies**
5. Refresh the page — you're now logged in

The popup shows how many cookies are stored and where they came from.

## Permissions

| Permission | Why |
|---|---|
| `cookies` | Read and write browser cookies |
| `storage` | Persist copied cookies between popup opens |
| `activeTab` | Access the current tab's URL |
| `<all_urls>` | Required by the cookies API to work on any domain |
