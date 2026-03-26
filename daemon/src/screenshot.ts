export async function captureScreenshot(
	port: number,
	outputPath: string,
): Promise<void> {
	// Dynamic import to avoid hard dependency on playwright
	const moduleName = "playwright";
	const pw = (await import(/* webpackIgnore: true */ moduleName)) as {
		chromium: {
			launch: () => Promise<{
				newPage: () => Promise<{
					goto: (url: string) => Promise<void>;
					waitForTimeout: (ms: number) => Promise<void>;
					screenshot: (opts: {
						path: string;
						fullPage: boolean;
					}) => Promise<void>;
				}>;
				close: () => Promise<void>;
			}>;
		};
	};

	const browser = await pw.chromium.launch();
	const page = await browser.newPage();
	await page.goto(`http://localhost:${port}`);
	await page.waitForTimeout(500);
	await page.screenshot({ path: outputPath, fullPage: true });
	await browser.close();
}
