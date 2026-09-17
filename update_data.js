process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
 
import { execSync } from 'child_process';
import { chromium } from 'playwright';
import fs from 'fs';
 
const LINK = 'https://ct0web06.br.bosch.com/Presenter/#!/presentation';
 
let crr_url = null;
 
const commit = () => {
  try {
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "update ${new Date().toISOString().slice(0, 10)}"`, {
      stdio: 'inherit'
    });
    execSync('git push', { stdio: 'inherit' });
  } catch (error) {
    console.log('Sem alterações para commitar ou erro no Git. Pulando...');
  }
};
 
while (true) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
 
  await new Promise(async (resolve) => {
    page.on('websocket', ws => {
      ws.on('framereceived', async frame => {
        try {
          const data = frame.payload;
 
          if (!data) return;
 
          const match = data.match(/"ImageUrl":"(.*?)","/);
          const url = match ? match[1] : null;
 
          if (!url || crr_url === url) return;
 
          const image = await fetch(url);
 
          if (!image.ok) {
            console.log(`Erro ao baixar imagem: ${image.status}`);
            return;
          }
 
          const buf = Buffer.from(await image.arrayBuffer());
          fs.writeFileSync('imagem.jpg', buf);
 
          crr_url = url;
 
          commit();
 
          await browser.close();
          resolve();
        } catch (error) {
          console.error(error);
        }
      });
    });
 
    await page.goto(LINK, { waitUntil: 'domcontentloaded' });
  });
}
 
 