import {test,expect} from '@playwright/test';

test('classroom projection, approved questions, safe fallback and return to setup',async({page})=>{
  const external:string[]=[];
  page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:')&&!r.url().startsWith('http://localhost:'))external.push(r.url());});
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  await page.getByRole('button',{name:'Load sample lesson'}).click();
  await expect(page.getByLabel('Lesson topic')).toHaveValue("Ohm's law");
  await page.getByRole('button',{name:'Start classroom'}).click();
  const classroom=page.getByRole('dialog',{name:'Classroom presentation'});
  await expect(classroom).toBeVisible();
  await expect(classroom.getByRole('heading',{name:'Introduction',exact:true})).toBeVisible();
  await classroom.getByRole('button',{name:'Next',exact:true}).click();
  await expect(classroom.getByRole('heading',{name:'Learning objectives'})).toBeVisible();
  await classroom.getByRole('button',{name:'Questions',exact:true}).click();
  await classroom.getByLabel('Learner question').fill("What is the formula for Ohm's law?");
  await classroom.getByRole('button',{name:'Ask question'}).click();
  await expect(classroom.getByText('Voltage equals current multiplied by resistance: V = I × R.',{exact:true})).toBeVisible();
  await expect(classroom.getByText('Teacher-provided question and answer')).toBeVisible();
  await classroom.getByLabel('Learner question').fill('What is the capital of Nigeria?');
  await classroom.getByRole('button',{name:'Ask question'}).click();
  await expect(classroom.getByText(/I do not have a verified answer/)).toBeVisible();
  await classroom.getByRole('button',{name:'Return to lesson'}).click();
  await expect(classroom.getByRole('heading',{name:'Learning objectives'})).toBeVisible();
  await classroom.getByRole('button',{name:'Exit lesson'}).click();
  await expect(classroom).not.toBeVisible();
  await expect(page.getByLabel('Lesson topic')).toHaveValue("Ohm's law");
  expect(external).toEqual([]);
});

test('classroom refuses incomplete Q/A and empty teaching content',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  await page.getByLabel('Lesson topic').fill('A topic');
  await page.getByLabel('Lesson plan').fill('# Questions and answers\nQ: An unanswered question?');
  await page.getByRole('button',{name:'Start classroom'}).click();
  await expect(page.getByRole('alert')).toContainText('Add an A: answer');
  await expect(page.getByRole('dialog',{name:'Classroom presentation'})).toHaveCount(0);
});

test('prepare a reference lesson, require review, and run a class check',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  await page.getByLabel('Reference topic').selectOption('physics-ohm');
  await page.getByRole('button',{name:'Prepare reference draft'}).click();
  await expect(page.getByLabel('Lesson topic')).toHaveValue("Ohm's law");
  await expect(page.getByLabel('Lesson plan')).toHaveValue(/V = IR/);
  const start=page.getByRole('button',{name:'Start classroom'});
  await expect(start).toBeDisabled();
  await page.getByLabel('I have reviewed these notes').check();
  await expect(start).toBeEnabled();
  await page.getByLabel('Lesson plan').fill('# Introduction\nTeacher-edited draft\n# Questions and answers\nQ: What is the formula?\nA: V = IR.');
  await expect(start).toBeDisabled();
  await page.getByLabel('I have reviewed these notes').check();
  await start.click();
  const classroom=page.getByRole('dialog',{name:'Classroom presentation'});
  await classroom.getByRole('button',{name:'Class check',exact:true}).click();
  const assessment=classroom.getByRole('region',{name:'Class assessment'});
  await expect(assessment.getByText('What is the formula?',{exact:true})).toBeVisible();
  await expect(assessment.getByText('V = IR.',{exact:true})).toHaveCount(0);
  await assessment.getByRole('button',{name:'Reveal answer'}).click();
  await expect(assessment.getByText('V = IR.',{exact:true})).toBeVisible();
  await assessment.getByRole('button',{name:'Return to lesson'}).click();
  await expect(assessment).toHaveCount(0);
});

test('import and export a reusable local lesson',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  await page.getByLabel('Import lesson file').setInputFiles({
    name:'Light.lesson.json',mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify({schema:'scoolabs.lesson',version:1,topic:'Light',plan:'# Introduction\nTeacher notes about light.'}))
  });
  await expect(page.getByLabel('Lesson topic')).toHaveValue('Light');
  await expect(page.getByRole('button',{name:'Start classroom'})).toBeDisabled();
  await page.getByLabel('I have reviewed these notes').check();
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Export lesson file'}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('scoolabs-light.lesson.json');
});

test('browser preview falls back to typing and never starts a microphone session',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>{throw new Error('Unexpected microphone capture');}}});
  });
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  await page.getByRole('button',{name:'Load sample lesson'}).click();
  await page.getByRole('button',{name:'Start classroom'}).click();
  const classroom=page.getByRole('dialog',{name:'Classroom presentation'});
  await classroom.getByRole('button',{name:'Questions',exact:true}).click();
  await expect(classroom.getByRole('button',{name:'Listen to question'})).toBeDisabled();
  await expect(classroom.getByRole('button',{name:'Stop listening'})).toBeDisabled();
  await expect(classroom.getByText(/Microphone recognition is available in the Windows desktop application only/)).toBeVisible();
  await classroom.getByLabel('Learner question').fill("What is the formula for Ohm's law?");
  await classroom.getByRole('button',{name:'Ask question'}).click();
  await expect(classroom.getByText('Voltage equals current multiplied by resistance: V = I × R.',{exact:true})).toBeVisible();
});
test('optional generative model is disabled in browser and ordinary classroom remains functional',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  await expect(page.getByRole('button',{name:'Check local model'})).toBeDisabled();
  await expect(page.getByRole('button',{name:'Generate AI lesson draft'})).toBeDisabled();
  await page.getByRole('button',{name:'Load sample lesson'}).click();
  await page.getByRole('button',{name:'Start classroom'}).click();
  const classroom=page.getByRole('dialog',{name:'Classroom presentation'});
  await classroom.getByRole('button',{name:'Questions',exact:true}).click();
  await classroom.getByLabel('Learner question').fill('Explain voltage and resistance');
  await classroom.getByRole('button',{name:'Ask question'}).click();
  await expect(classroom.getByRole('button',{name:'Suggest AI answer'})).toHaveCount(0);
  await expect(classroom.getByText(/Related lesson excerpt:/)).toBeVisible();
});

test('shared Silabs AI is the default and optional local pack is explicit',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  const provider=page.getByLabel('AI provider');
  await expect(provider).toHaveValue('silabs');
  await provider.selectOption('llama');
  await expect(provider).toHaveValue('llama');
  await expect(page.getByRole('button',{name:'Check local model'})).toBeDisabled();
  await provider.selectOption('silabs');
  await page.getByRole('button',{name:'Load sample lesson'}).click();
  await expect(page.getByRole('button',{name:'Start classroom'})).toBeEnabled();
});

test('whiteboard uses live science controls and hides demonstrations during assessment',async({page})=>{
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Smart Teacher',exact:true}).click();
  await page.getByRole('button',{name:'Load sample lesson'}).click();
  await page.getByLabel('Lesson duration (minutes)').fill('35');
  await page.getByLabel('Discussion break (seconds)').fill('30');
  await page.getByRole('button',{name:'Start classroom'}).click();
  const classroom=page.getByRole('dialog',{name:'Classroom presentation'});
  await expect(classroom.getByText(/Lesson time:.*35 min/)).toBeVisible();
  await expect(classroom.getByRole('button',{name:'Open TV display'})).toBeDisabled();
  await classroom.getByRole('button',{name:'Digital whiteboard',exact:true}).click();
  await classroom.getByRole('button',{name:'Use suggested demonstration'}).click();
  const board=classroom.getByRole('region',{name:'Digital whiteboard'});
  await expect(board.getByText('V = I × R',{exact:true})).toBeVisible();
  await expect(board.getByText('3.00 A',{exact:true})).toHaveCount(2);
  await classroom.getByRole('slider',{name:'Supply voltage'}).fill('24');
  await expect(board.getByText('6.00 A',{exact:true})).toHaveCount(2);
  await classroom.getByRole('button',{name:'Class check',exact:true}).click();
  await expect(board).toHaveCount(0);
  await classroom.getByRole('button',{name:'Return to lesson'}).click();
  await expect(board).toBeVisible();
  await classroom.getByRole('button',{name:'Clear whiteboard'}).click();
  await expect(board).toHaveCount(0);
  await classroom.getByRole('button',{name:'Exit lesson'}).click();
  await expect(classroom).not.toBeVisible();
});
