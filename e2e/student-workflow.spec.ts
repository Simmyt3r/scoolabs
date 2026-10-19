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
  await page.getByText('Resistance',{exact:true}).locator('../..').locator('input[type="range"]').fill('20');
  await expect(sheet.getByText('Waiting for a reading')).toBeVisible();
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(1);
});


test('pendulum readings plot period squared while angle changes reset the experiment series',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Physics'}).click();
  await page.getByRole('button',{name:/Simple Pendulum/}).click();
  const sheet=page.getByRole('region',{name:'Pendulum observation sheet'});
  await expect(sheet.getByText('Waiting for a reading')).toBeVisible();
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(1);
  await page.getByText('Length',{exact:true}).locator('../..').locator('input[type="range"]').fill('2');
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(2);
  await expect(sheet.getByText(/Model-derived g/)).toBeVisible();
  await page.getByText('Angle',{exact:true}).locator('../..').locator('input[type="range"]').fill('10');
  await expect(sheet.getByText('Waiting for a reading')).toBeVisible();
});

test('potometer captures modelled uptake and resets observations if capillary diameter changes',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Biology'}).click();
  await page.getByRole('button',{name:/Transpiration/}).click();
  const sheet=page.getByRole('region',{name:'Potometer observation sheet'});
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await page.locator('.lab-controls label.control').filter({hasText:'Elapsed time'}).locator('input[type="range"]').fill('20');
  await sheet.getByRole('button',{name:'Capture reading'}).click();
  await expect(sheet.locator('tbody tr')).toHaveCount(2);
  await expect(sheet.getByText(/Model-derived uptake/)).toBeVisible();
  await page.locator('.lab-controls label.control').filter({hasText:'Capillary diameter'}).locator('input[type="range"]').fill('2');
  await expect(sheet.getByText('Waiting for a reading')).toBeVisible();
});

test('formative knowledge checks show explanations, permit retry and reset when navigating',async({page})=>{
 await page.goto('/');
 const check=page.getByRole('region',{name:'Knowledge check'});
 await expect(check.getByRole('button',{name:'Check answers'})).toBeDisabled();
 const questions=check.locator('fieldset.knowledge-question');
 await questions.nth(0).locator('input[type="radio"]').nth(0).check();
 await questions.nth(1).locator('input[type="radio"]').nth(1).check();
 await check.getByRole('button',{name:'Check answers'}).click();
 await expect(check.getByText('2/2 correct')).toBeVisible();
 await expect(check.getByText(/Browser preview only/)).toBeVisible();
 await expect(check.locator('.knowledge-explanation')).toHaveCount(2);
 await check.getByRole('button',{name:'Try again'}).click();
 await expect(check.getByRole('button',{name:'Check answers'})).toBeDisabled();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Biology'}).click();
 await expect(page.locator('.practical-manual')).toHaveCount(1);
 await expect(page.locator('.knowledge-check')).toHaveCount(1);
 await expect(check.locator('fieldset.knowledge-question')).toHaveCount(2);
});
test('all twelve experiments display one guide and two formative questions',async({page})=>{
 await page.goto('/');
 for(const subject of ['Chemistry','Physics','Biology','Agriculture']){
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:subject}).click();
  for(const tab of await page.locator('.experiment-pill').all()){
   await tab.click();
   await expect(page.locator('.practical-manual')).toHaveCount(1);
   await expect(page.locator('.knowledge-check')).toHaveCount(1);
   await expect(page.locator('.knowledge-question')).toHaveCount(2);
  }
 }
});

test('student dashboard starts empty and opens the suggested practical',async({page})=>{
 await page.goto('/');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My progress/}).click();
 const dashboard=page.getByRole('region',{name:'Student progress dashboard'});
 await expect(dashboard).toBeVisible();
 await expect(dashboard.getByText('Not marked')).toBeVisible();
 await expect(dashboard.getByText('0/3 tried')).toHaveCount(4);
 await expect(dashboard.getByText(/Browser preview mode/)).toBeVisible();
 await dashboard.getByRole('button',{name:'Open practical'}).click();
 await expect(page.getByText('Acid–Base Titration',{exact:true}).first()).toBeVisible();
});
test('student dashboard reads saved reports and respects a zero teacher grade',async({page})=>{
 await page.addInitScript(()=>{
   localStorage.setItem('scoolabs.profile.v1',JSON.stringify({name:'Ada Musa',classroom:'SS2A'}));
   localStorage.setItem('scoolabs.records.v1',JSON.stringify([
     {id:'r1',timestamp:'2026-10-11T12:00:00Z',student:'Ada Musa',classroom:'SS2A',experimentId:'titration',
      experimentTitle:'Acid–Base Titration',subject:'chemistry',settings:'Acid 25mL',
      observation:'pH 7',conclusion:'Neutral',grade:0,feedback:'Review the endpoint',assignmentId:null},
     {id:'r2',timestamp:'2026-10-11T13:00:00Z',student:'Ada Musa',classroom:'SS2A',experimentId:'titration',
      experimentTitle:'Acid–Base Titration',subject:'chemistry',settings:'Acid 25mL',
      observation:'pH 8',conclusion:'Indicator changes',grade:null,feedback:null,assignmentId:null}
   ]));
 });
 await page.goto('/');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My progress/}).click();
 const dashboard=page.getByRole('region',{name:'Student progress dashboard'});
 await expect(dashboard.getByRole('heading',{name:'Welcome, Ada'})).toBeVisible();
 await expect(dashboard.locator('.learning-stats>div').nth(0)).toContainText('1');
 await expect(dashboard.locator('.learning-stats>div').nth(1)).toContainText('2');
 await expect(dashboard.getByText('0/100',{exact:true})).toBeVisible();
 await expect(dashboard.getByText('Review the endpoint')).toBeVisible();
 await page.reload();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My progress/}).click();
 await expect(page.getByRole('region',{name:'Student progress dashboard'}).getByText('Review the endpoint')).toBeVisible();
});


test('keyboard skip navigation reaches main content',async({page})=>{
 await page.goto('/');
 await page.keyboard.press('Tab');
 await expect(page.getByRole('link',{name:'Skip to main content'})).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(page.locator('#scoolabs-main')).toBeFocused();
});
test('student profile dialog traps Tab, closes on Escape and restores trigger focus',async({page})=>{
 await page.goto('/');
 const button=page.getByRole('button',{name:'Student profile'});
 await button.focus();
 await button.press('Enter');
 const dialog=page.getByRole('dialog',{name:'Student profile'});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button',{name:'Close'})).toBeFocused();
 await page.keyboard.press('Shift+Tab');
 await expect(dialog.getByRole('button',{name:'Save profile'})).toBeFocused();
 await page.keyboard.press('Tab');
 await expect(dialog.getByRole('button',{name:'Close'})).toBeFocused();
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
 await expect(button).toBeFocused();
});
test('student report prompts never save the blank scaffold as a conclusion',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Record these results'}).click();
 const dialog=page.getByRole('dialog',{name:'Save your experiment'});
 await dialog.getByRole('button',{name:'Show writing prompts'}).click();
 await expect(dialog.getByText('Questions from this experiment')).toBeVisible();
 await dialog.getByRole('button',{name:'Insert a blank reflection structure'}).click();
 await expect(dialog.getByPlaceholder('What did you discover?')).toContainText('[write what changed]');
 await dialog.getByRole('button',{name:'Save to notebook'}).click();
 await expect(dialog.getByRole('alert')).toContainText('Finish or delete every');
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
});
test('report preview restores notebook focus after Escape',async({page})=>{
 await page.addInitScript(()=>{
  localStorage.setItem('scoolabs.profile.v1',JSON.stringify({name:'Test Student',classroom:'SS2A'}));
  localStorage.setItem('scoolabs.records.v1',JSON.stringify([{
   id:'k1',timestamp:'2026-10-11T13:00:00Z',student:'Test Student',classroom:'SS2A',
   experimentId:'titration',experimentTitle:'Acid–Base Titration',subject:'chemistry',
   settings:'25mL',observation:'pH changed',conclusion:'Equivalence close to indicator change',
   grade:0,feedback:'Review the data'
  }]));
 });
 await page.goto('/');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My notebook/}).click();
 const open=page.getByRole('button',{name:'Preview / print report'});
 await open.focus();
 await open.press('Enter');
 await expect(page.getByRole('dialog',{name:'Practical report preview'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'Practical report preview'})).toHaveCount(0);
 await expect(open).toBeFocused();
});


test('mobile navigation opens, marks itself expanded, and closes with Escape',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 const menu=page.getByRole('button',{name:'Open menu'});
 await expect(menu).toBeVisible();
 await expect(menu).toHaveAttribute('aria-expanded','false');
 await menu.click();
 await expect(menu).toHaveAttribute('aria-expanded','true');
 await expect(page.getByRole('button',{name:'Close menu'})).toBeVisible();
 await page.keyboard.press('Escape');
 await expect(menu).toHaveAttribute('aria-expanded','false');
 await menu.click();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My progress/}).click();
 await expect(page.getByRole('region',{name:'Student progress dashboard'})).toBeVisible();
 await expect(menu).toHaveAttribute('aria-expanded','false');
});
test('small screens keep report-writing modal usable with the keyboard',async({page})=>{
 await page.setViewportSize({width:360,height:640});
 await page.goto('/');
 await page.getByRole('button',{name:'Record these results'}).click();
 const dialog=page.getByRole('dialog',{name:'Save your experiment'});
 await expect(dialog).toBeVisible();
 await dialog.getByRole('button',{name:'Show writing prompts'}).click();
 await expect(dialog.getByText('Questions from this experiment')).toBeVisible();
 await dialog.getByRole('button',{name:'Hide writing prompts'}).click();
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
});


test('Scoolabs visual identity loads from bundled local assets on the student workspace',async({page})=>{
 await page.goto('/');
 const logo=page.locator('.brand .scoolabs-lockup-icon');
 await expect(logo).toBeVisible();
 await expect(logo).toHaveAttribute('src','/brand/scoolabs-mark.svg');
 expect(await logo.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','/brand/scoolabs-mark.svg');
 await expect(page).toHaveTitle(/Scoolabs.*Learn/);
});

test('Scoolabs branded printable reports include the official in-app icon',async({page})=>{
 await page.addInitScript(()=>{
   localStorage.setItem('scoolabs.profile.v1',JSON.stringify({name:'Learner',classroom:'SS2A'}));
   localStorage.setItem('scoolabs.records.v1',JSON.stringify([{id:'branded',timestamp:'2026-10-11T09:00:00Z',student:'Learner',classroom:'SS2A',experimentId:'titration',experimentTitle:'Titration',subject:'chemistry',settings:'25mL',observation:'pH 7',conclusion:'Neutralisation',grade:null,feedback:null}]));
 });
 await page.goto('/');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:/My notebook/}).click();
 await page.getByRole('button',{name:'Preview / print report'}).click();
 const mark=page.getByRole('dialog',{name:'Practical report preview'}).locator('.report-sheet-mark img');
 await expect(mark).toBeVisible();
 expect(await mark.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
});


test('Scoolabs Help and About is usable offline and links to teacher setup',async({page})=>{
 await page.goto('/');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Help & About'}).click();
 const about=page.getByRole('region',{name:'About Scoolabs'});
 await expect(about).toBeVisible();
 await expect(about.getByRole('heading',{name:'Practical science for every classroom.'})).toBeVisible();
 await expect(about).toContainText("Simeon's Laboratories and Co Technologies Ltd");
 await expect(about.getByRole('link',{name:'silabtechnologies@gmail.com'})).toHaveAttribute('href','mailto:silabtechnologies@gmail.com');
 await about.getByText('Where are student records saved?').click();
 await expect(about).toContainText('not automatically encrypted');
 await about.getByRole('button',{name:/Continue learning/}).click();
 await expect(page.getByRole('region',{name:'Student progress dashboard'})).toBeVisible();
});


test('chemistry periodic table shows 118 actual elements and meaningful properties',async({page})=>{
 await page.goto('/');
 const hub=page.getByRole('region',{name:'Chemistry knowledge and apparatus hub'});
 await expect(hub).toBeVisible();
 await hub.getByRole('tab',{name:'Periodic table'}).click();
 const table=page.getByRole('region',{name:'Interactive periodic table'});
 await expect(table.getByRole('button',{name:/atomic number/})).toHaveCount(118);
 await table.getByRole('button',{name:'Oxygen, atomic number 8'}).click();
 const detail=table.getByRole('region',{name:'Element properties: Oxygen'});
 await expect(detail).toBeVisible();
 await expect(detail).toContainText('8');
 await expect(detail).toContainText('Electron configuration');
 await table.getByRole('button',{name:'Add to comparison'}).click();
 await table.getByRole('button',{name:'Hydrogen, atomic number 1'}).click();
 await table.getByRole('button',{name:'Add to comparison'}).click();
 const compare=table.getByRole('region',{name:'Compare elements'});
 await expect(compare).toContainText('Oxygen');
 await expect(compare).toContainText('Hydrogen');
 await table.getByRole('searchbox',{name:'Search elements'}).fill('gold');
 await expect(table.getByText('1 / 118')).toBeVisible();
 await table.getByRole('button',{name:'Gold, atomic number 79'}).click();
 await expect(table.getByRole('region',{name:'Element properties: Gold'})).toBeVisible();
});

test('chemistry equipment guide explains burette use and connects to practicals',async({page})=>{
 await page.goto('/');
 const hub=page.getByRole('region',{name:'Chemistry knowledge and apparatus hub'});
 await hub.getByRole('tab',{name:'Apparatus'}).click();
 const library=page.getByRole('region',{name:'Chemistry apparatus'});
 await library.getByRole('searchbox',{name:'Search apparatus'}).fill('burette');
 await expect(library.locator('.apparatus-choice').filter({hasText:/^Burette/})).toHaveCount(1);
 await library.getByRole('button',{name:/^Burette/}).click();
 await expect(library.getByRole('article',{name:'Equipment guide: Burette'})).toContainText('meniscus');
 await expect(library.getByRole('article',{name:'Equipment guide: Burette'})).toContainText('Safety and limitations');
 await library.getByRole('button',{name:/Try related practical:/}).click();
 await expect(page.locator('.experiment-pill.active')).toContainText('Titration');
});

test('all four subjects include searchable concepts and apparatus libraries',async({page})=>{
 await page.goto('/');
 for(const subject of ['Chemistry','Physics','Biology','Agriculture']){
   await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:subject}).click();
   const hub=page.locator('.subject-explorer');
   await expect(hub).toBeVisible();
   await hub.getByRole('tab',{name:'Key concepts'}).click();
   await expect(hub.locator('.reference-item')).toHaveCount(10);
   await expect(hub.getByText('10 topics found')).toBeVisible();
   await hub.locator('.reference-item').first().locator('summary').click();
   await expect(hub.locator('.reference-details').first()).toBeVisible();
   await hub.getByRole('tab',{name:'Apparatus'}).click();
   await expect(hub.locator('.apparatus-choice')).toHaveCount(12);
   await expect(hub.locator('.apparatus-detail')).toBeVisible();
 }
});


test('representative apparatus expose labelled, interactive diagrams in all four subjects',async({page})=>{
 await page.goto('/');
 const cases=[
  {subject:'Chemistry',name:'Beaker',part:'Graduation marks'},
  {subject:'Physics',name:'Metre rule',part:'Zero mark'},
  {subject:'Biology',name:'Compound light microscope',part:'Objective lenses'},
  {subject:'Agriculture',name:'Hoe',part:'Metal head'}
 ];
 for(const item of cases){
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:item.subject}).click();
  const hub=page.locator('.subject-explorer');
  await hub.getByRole('tab',{name:'Apparatus'}).click();
  const guide=hub.locator('.apparatus-detail');
  await expect(guide.getByRole('img',{name:new RegExp('Simplified, labelled diagram of '+item.name)})).toBeVisible();
  await expect(guide.getByRole('group',{name:item.name+' diagram parts'})).toBeVisible();
  await guide.getByRole('button',{name:item.part}).click();
  await expect(guide.getByRole('button',{name:item.part})).toHaveAttribute('aria-pressed','true');
 }
});


test('physics subject reference shows searchable equations and downloaded constants offline', async({page})=>{
 await page.goto('/');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Physics'}).click();
 await page.getByRole('tab',{name:'Subject reference'}).click();
 const atlas=page.getByRole('region',{name:'physics interactive reference atlas'});
 await expect(atlas).toBeVisible();
 await atlas.getByRole('searchbox',{name:'Search reference cards'}).fill('Ohm');
 await expect(atlas.getByText('1 reference card')).toBeVisible();
 await expect(atlas.getByText('V = IR')).toBeVisible();
 await atlas.getByRole('button',{name:'View 10 constants'}).click();
 await expect(atlas.getByText('Speed of light in vacuum')).toBeVisible();
 await expect(atlas.getByText('299 792 458')).toBeVisible();
 await atlas.getByRole('button',{name:'Hide constants'}).click();
 await expect(atlas.getByText('299 792 458')).toHaveCount(0);
});
test('biology specimen names and agriculture crops are distinct subject references',async({page})=>{
 await page.goto('/');
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Biology'}).click();
 await page.getByRole('tab',{name:'Subject reference'}).click();
 const biology=page.getByRole('region',{name:'biology interactive reference atlas'});
 await biology.getByRole('searchbox',{name:'Search reference cards'}).fill('Paramecium');
 await expect(biology.getByText('Paramecium (genus)')).toBeVisible();
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Agriculture'}).click();
 await page.getByRole('tab',{name:'Subject reference'}).click();
 const agriculture=page.getByRole('region',{name:'agriculture interactive reference atlas'});
 await agriculture.getByRole('searchbox',{name:'Search reference cards'}).fill('Manihot');
 await expect(agriculture.getByText('Manihot esculenta',{exact:true})).toBeVisible();
 await expect(agriculture.getByRole('heading',{name:'Cassava',exact:true})).toBeVisible();
});
