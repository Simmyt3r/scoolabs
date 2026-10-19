import {test,expect} from '@playwright/test';

test('offline AI search still returns cited references without the model in browser preview',async({page})=>{
  const external:string[]=[];
  page.on('request',request=>{
    if (!request.url().startsWith('http://127.0.0.1:') && !request.url().startsWith('http://localhost:')) {
      external.push(request.url());
    }
  });
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'})
    .getByRole('button',{name:'Offline AI Search'}).click();
  await page.getByLabel('Science subject').selectOption('chemistry');
  await page.getByRole('searchbox',{name:'Science reference question'}).fill('sodium chloride');
  await page.getByRole('button',{name:'Search references'}).click();
  await expect(page.getByRole('heading',{name:'Sodium chloride'})).toBeVisible();
  await expect(page.getByText(/Source: NIH PubChem/).first()).toBeVisible();
  await expect(page.getByRole('button',{name:/Find by meaning/})).toBeDisabled();
  expect(external).toEqual([]);
});
