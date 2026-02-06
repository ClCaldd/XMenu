process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { execSync } from 'child_process';
import { chromium } from 'playwright';
import fs from 'fs';

let crr_url
let crr_date = new Date().toISOString().slice(0, 10);

const commit = () => {
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "update ${new Date().toISOString().slice(0,10)}"`, { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
}

while(true)
{
  const date = new Date().toISOString().slice(0, 10)
  if(crr_date != date)
  {
    fs.copyFileSync(
      './states/out_of_date.png',
      './status.png'
    );
    crr_date = date
    commit()
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await new Promise(async (resolve) => {

    page.on('websocket', ws => {
      ws.on('framereceived', async frame => {

        const data = frame.payload
        if(!data)
            return

        const m = data.match(/"ImageUrl":"(.*?)","/);
        let url = m ? m[1] : null;

        if(!url || crr_url == url)
            return

        const image = await fetch(url);
        const buf = Buffer.from(await image.arrayBuffer());
        fs.writeFileSync('imagem.jpg', buf);
        commit()

        crr_url = url
        fs.copyFileSync(
        './states/updated.png',
        './status.png'
      );
        await browser.close();
        resolve();
      });
    });
    await page.goto('https://ctweb03.br.bosch.com/presenter/#!/presentation');
    await new Promise(resolve => browser.on('disconnected', resolve));
  })
}



