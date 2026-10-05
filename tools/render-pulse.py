# Renders the PULSE gallery stills and feature video from tools/pulse-render.html.
# Needs the Vite dev server running (npx vite --port 5199) and ffmpeg.
import asyncio, sys, os, subprocess, shutil
from playwright.async_api import async_playwright
URL = 'http://localhost:5199/tools/pulse-render.html'
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'media')
MODE = sys.argv[1] if len(sys.argv) > 1 else 'all'   # stills | watches | video | test | all
FPS = 24
async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        if MODE in ('stills', 'all', 'test'):
            pg = await b.new_page(viewport={'width': 1200, 'height': 1200})
            await pg.goto(URL); await pg.evaluate('window.ready')
            for n in ['photo', 'apps', 'sports', 'workout', 'health']:
                await pg.evaluate(f'window.still("{n}")'); await pg.wait_for_timeout(200)
                png = f'/tmp/pulse-{n}.png'
                await pg.screenshot(path=png)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', png, '-q:v', '82', os.path.join(OUT, f'pulse-{n}.webp')], check=True)
            await pg.close()
        if MODE in ('watches', 'all'):
            pg = await b.new_page(viewport={'width': 1200, 'height': 1200})
            await pg.goto(URL); await pg.evaluate('window.ready')
            for n in ['arc', 'noir', 'atlas', 'elan', 'void', 'apex', 'mono', 'flora', 'jardin', 'luna', 'aura']:
                await pg.evaluate(f'window.photoOf("{n}")'); await pg.wait_for_timeout(300)
                png = f'/tmp/watch-{n}.png'
                await pg.screenshot(path=png)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', png, '-q:v', '82', os.path.join(OUT, f'{n}-photo.webp')], check=True)
            await pg.close()
        if MODE in ('video', 'all', 'test'):
            pg = await b.new_page(viewport={'width': 960, 'height': 960})
            await pg.goto(URL); await pg.evaluate('window.ready')
            dur = await pg.evaluate('window.DURATION')
            fr = '/tmp/pulse-frames'; shutil.rmtree(fr, ignore_errors=True); os.makedirs(fr)
            times = [1.5, 5, 8.5, 11.5, 14.5, 17.5, 21, 24.5, 26.5] if MODE == 'test' else [i / FPS for i in range(int(dur * FPS))]
            for i, t in enumerate(times):
                await pg.evaluate(f'window.videoAt({t})')
                await pg.screenshot(path=f'{fr}/f{i:05d}.jpg', type='jpeg', quality=92)
                if i % 48 == 0: print('frame', i, '/', len(times), flush=True)
            if MODE != 'test':
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{fr}/f%05d.jpg',
                                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart',
                                os.path.join(OUT, 'pulse-features.mp4')], check=True)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{fr}/f%05d.jpg',
                                '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', '-pix_fmt', 'yuv420p',
                                os.path.join(OUT, 'pulse-features.webm')], check=True)
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', '5', '-i', os.path.join(OUT, 'pulse-features.mp4'), '-frames:v', '1', '-q:v', '80', os.path.join(OUT, 'pulse-features-poster.webp')], check=True)
        await b.close()
asyncio.run(main())
