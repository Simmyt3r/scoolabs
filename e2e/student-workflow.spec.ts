import { test, expect } from '@playwright/test';

test('all four science subjects contain three working experiments', async ({ page }) => {
  await page.goto('/');
  for (const subject of ['Chemistry','Physics','Biology','Agriculture']) {
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: subject }).click();
    await expect(page.locator('.experiment-pill')).toHaveCount(3);
    for (const button of await page.locator('.experiment-pill').all()) {
      await expect(button).toBeEnabled();
      await button.click();
      await expect(page.locator('.lab-grid')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Record these results' })).toBeVisible();
    }
  }
});

test('notebook survives page restart in the browser-only preview', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Student profile' }).click();
  const profile = page.getByRole('dialog', { name: 'Student profile' });
  await profile.getByPlaceholder('Your name').fill('Pilot Learner');
  await profile.getByPlaceholder('SS2A').fill('SS2A');
  await profile.getByRole('button', { name: 'Save profile' }).click();
  await page.getByRole('button', { name: 'Record these results' }).click();
  const notebook = page.getByRole('dialog', { name: 'Save your experiment' });
  await notebook.getByPlaceholder('What did you discover?').fill('The burette reading affects pH.');
  await notebook.getByRole('button', { name: 'Save to notebook' }).click();
  await expect(page.getByText('Observation saved to your offline notebook.')).toBeVisible();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /My notebook/ }).click();
  await expect(page.locator('.records-table')).toContainText('Pilot Learner');
  await expect(page.locator('.records-table')).toContainText('The burette reading affects pH.');
  await page.reload();
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /My notebook/ }).click();
  await expect(page.locator('.records-table')).toContainText('Pilot Learner');
});

test('teacher panel gives clear desktop-only feedback in web preview', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: 'Teacher workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Teacher workspace' })).toBeVisible();
  await expect(page.getByText(/requires the installed Scoolabs desktop application/)).toBeVisible();
});

test('each virtual practical includes an offline learning manual', async ({page})=>{
  await page.goto('/');
  const subjects=['Chemistry','Physics','Biology','Agriculture'];
  for(const subject of subjects){
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:subject}).click();
    for(const tab of await page.locator('.experiment-pill').all()){
      await tab.click();
      const guide=page.locator('.practical-manual');
      await expect(guide).toBeVisible();
      await guide.locator('summary').click();
      await expect(guide.getByText('Step-by-step method')).toBeVisible();
      await expect(guide.getByText('Safety guidance')).toBeVisible();
    }
  }
});

test('students can find the assignments workspace offline',async({page})=>{await page.goto('/');await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My assignments/}).click();await expect(page.getByRole('heading',{name:'Class assignments'})).toBeVisible();await expect(page.getByText('No practical assignments yet')).toBeVisible();});


test('saved student practicals have a paper-ready report preview',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('scoolabs.profile.v1',JSON.stringify({name:'Test Learner',classroom:'SS2A'}));
    localStorage.setItem('scoolabs.records.v1',JSON.stringify([{
      id:'record-a',timestamp:'2026-10-11T12:00:00Z',student:'Test Learner',classroom:'SS2A',
      experimentId:'ohms-law',experimentTitle:"Ohm's Law",subject:'physics',
      settings:'Voltage 3 V; resistance 10 ohms',observation:'Current = 0.30 A',
      conclusion:'Current is proportional to voltage',grade:0,feedback:'Revise the explanation'
    }]));
  });
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My notebook/}).click();
  await page.getByRole('button',{name:'Preview / print report'}).click();
  const report=page.getByRole('dialog',{name:'Practical report preview'});
  await expect(report).toBeVisible();
  await expect(report).toContainText('Test Learner');
  await expect(report).toContainText('Current = 0.30 A');
  await expect(report).toContainText('0 / 100');
  await expect(report.getByRole('button',{name:'Print report'})).toBeVisible();
  await page.emulateMedia({media:'print'});
  await expect(page.locator('.report-sheet')).toBeVisible();
  await expect(page.locator('.report-preview-toolbar')).toBeHidden();
  await expect(page.locator('#root')).toBeHidden();
  await page.emulateMedia({media:'screen'});
  await report.getByRole('button',{name:'Close'}).click();
  await expect(report).toHaveCount(0);
});


test('chemistry lab stores only explicitly captured titration readings', async ({page})=>{
  await page.goto('/');
  const sheet=page.getByRole('region',{name:'Titration observation sheet'});
  await expect(sheet).toBeVisible();
  await expect(sheet.getByText('Waiting for a reading')).toBeVisible();
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button',{name:'+ 1 mL'}).click();
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(2);
  await sheet.getByRole('button',{name:'Clear'}).click();
  await expect(sheet.getByText('Waiting for a reading')).toBeVisible();
});
test('physics reading log resets when the circuit resistance changes', async ({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Physics'}).click();
  const sheet=page.getByRole('region',{name:'Circuit observation sheet'});
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(1);
  await page.getByText('Resistance',{exact:true}).locator('..').locator('input[type="range"]').fill('20');
  await expect(sheet.getByText('Waiting for a reading')).toBeVisible();
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(1);
});
