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