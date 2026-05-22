import { expect, type Page, test } from '@playwright/test'

const cep = '12236063'

async function mockViaCep(page: Page) {
  await page.route(`https://viacep.com.br/ws/${cep}/json/`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cep: '12236-063',
        logradouro: 'Rua Angelo Bravini',
        complemento: '',
        bairro: 'Jardim Terras do Sul',
        localidade: 'Sao Jose dos Campos',
        uf: 'SP',
      }),
    })
  })
}

test.describe('onboarding familia', () => {
  test('CEP na home leva para onboarding de familia com CEP preservado', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await page.getByLabel('CEP').fill('12236-063')
    await page.getByRole('button', { name: /Buscar profissionais/i }).first().click()

    await expect(page).toHaveURL(/\/onboarding\?type=family&cep=12236063/)
    await expect(page.getByRole('button', { name: /Continuar com o Google/i })).toBeVisible()
  })

  test('fluxo Google simulado preserva CEP e preenche endereco', async ({ page }) => {
    await mockViaCep(page)

    await page.goto(`/onboarding?from=google&type=family&cep=${cep}`, { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { name: /Como/i })).toBeVisible()
    await expect(page.getByText(/Sou Fam/i)).toBeVisible()
    await page.getByRole('button', { name: /^Continuar$/ }).click()

    await page.getByLabel(/Telefone/i).fill('11999999999')
    await page.getByRole('button', { name: /^Continuar$/ }).click()

    await expect(page.getByRole('heading', { name: /endere/i })).toBeVisible()
    await expect(page.getByLabel('CEP')).toHaveValue(cep)
    await expect(page.getByLabel('Rua')).toHaveValue('Rua Angelo Bravini')
    await expect(page.getByLabel('Bairro')).toHaveValue('Jardim Terras do Sul')
    await expect(page.getByLabel('Cidade')).toHaveValue('Sao Jose dos Campos')
    await expect(page.getByLabel('Estado')).toHaveValue('SP')
    await expect(page.getByRole('button', { name: /^Continuar$/ })).toBeDisabled()
  })
})
