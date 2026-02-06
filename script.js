process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { chromium } from 'playwright';
import fs from 'fs';
let url

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('websocket', ws => {
  ws.on('framereceived', async frame => {

    const data = frame.payload
    if(!data)
        return

    const m = data.match(/"ImageUrl":"(.*?)","/);
    url = m ? m[1] : null;

    if(!url)
        return

    const image = await fetch(url);
    const buf = Buffer.from(await image.arrayBuffer());
    fs.writeFileSync('imagem.jpg', buf);

    console.log('WS <-', url);
  });
});

await page.goto('https://ctweb03.br.bosch.com/presenter/#!/presentation');