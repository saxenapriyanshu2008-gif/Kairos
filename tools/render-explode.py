# Renders tools/explode-sample.html to an MP4 (needs the dev server on :5199 and ffmpeg)
import asyncio, os, shutil, subprocess, sys
from playwright.async_api import async_playwright
FPS = 30
OUT = sys.argv[1] if len(sys.argv) > 1 else '/tmp/explode-sample.mp4'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 1280, 'height': 720})
        await pg.goto('http://localhost:5199/tools/explode-sample.html'); await pg.evaluate('window.ready')
        dur = await pg.evaluate('window.DURATION')
        fr = '/tmp/explode-frames'; shutil.rmtree(fr, ignore_errors=True); os.makedirs(fr)
        n = int(dur * FPS)
        for i in range(n):
            await pg.evaluate(f'window.at({i / FPS})')
            await pg.screenshot(path=f'{fr}/f{i:05d}.jpg', type='jpeg', quality=92)
            if i % 60 == 0: print('frame', i, '/', n, flush=True)
        await b.close()
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{fr}/f%05d.jpg', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-preset', 'slow', '-movflags', '+faststart', OUT], check=True)
asyncio.run(main())
