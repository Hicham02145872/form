const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.AUTH_TEST_URL || 'http://127.0.0.1:5174';
const user = { id: '11111111-1111-4111-8111-111111111111', aud: 'authenticated', role: 'authenticated', email: 'admin@example.test', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const page = await browser.newPage();
    let admin = false;
    let validUser = true;
    let feedbackReads = 0;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://auth-test.supabase.co/**', async route => {
      const url = new URL(route.request().url());
      let body;
      let status = 200;
      if (url.pathname.endsWith('/token')) body = { access_token: 'test-token', refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user };
      else if (url.pathname.endsWith('/user')) {
        status = validUser ? 200 : 401;
        body = validUser ? user : { code: 'bad_jwt', message: 'Invalid session' };
      } else if (url.pathname.endsWith('/logout')) { status = 204; }
      else if (url.pathname === '/rest/v1/admins') body = admin ? { user_id: user.id } : null;
      else if (url.pathname === '/rest/v1/feedback') { feedbackReads++; body = []; }
      else throw new Error(`Unexpected Supabase request: ${url.pathname}`);
      await route.fulfill({ status, contentType: 'application/json', body: status === 204 ? '' : JSON.stringify(body) });
    });
    const login = async () => {
      await page.getByLabel('Adresse e-mail').fill(user.email);
      await page.getByLabel('Mot de passe').fill('test-password');
      await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
    };
    await page.goto(`${base}/#admin`);
    await page.getByRole('heading', { name: 'Heureux de vous revoir.' }).waitFor();
    assert.equal(feedbackReads, 0, 'Signed-out visitors must not fetch feedback');
    await login();
    await page.getByRole('heading', { name: 'Accès réservé.' }).waitFor();
    assert.equal(feedbackReads, 0, 'Non-admin users must not fetch feedback');
    await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
    await page.getByLabel('Adresse e-mail').waitFor();
    admin = true;
    const firstFeedback = page.waitForResponse(response => response.url().includes('/rest/v1/feedback'));
    await login();
    await page.getByRole('heading', { name: 'Le pouls du campus.' }).waitFor();
    await firstFeedback;
    assert.ok(feedbackReads > 0, 'Verified admins should fetch feedback');
    const restoredFeedback = page.waitForResponse(response => response.url().includes('/rest/v1/feedback'));
    await page.reload();
    await page.getByRole('heading', { name: 'Le pouls du campus.' }).waitFor();
    await restoredFeedback;
    // Revoke admin membership while a valid session remains in browser storage.
    admin = false;
    const beforeRevocation = feedbackReads;
    await page.reload();
    await page.getByRole('heading', { name: 'Accès réservé.' }).waitFor();
    assert.equal(feedbackReads, beforeRevocation, 'Revoked admins must not fetch feedback');
    // Reject a saved session at the Auth server, even with admin membership.
    admin = true;
    validUser = false;
    await page.reload();
    await page.getByLabel('Adresse e-mail').waitFor();
    assert.equal(feedbackReads, beforeRevocation, 'Invalid saved sessions must not fetch feedback');
    validUser = true;
    await login();
    await page.getByRole('heading', { name: 'Le pouls du campus.' }).waitFor();
    await page.getByRole('button', { name: 'Déconnexion', exact: true }).click();
    await page.getByLabel('Adresse e-mail').waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Le pouls du campus.' }).count(), 0);
    await page.reload();
    await page.getByLabel('Adresse e-mail').waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: signed-out guard, non-admin denial, admin login, session restoration, revoked membership, invalid token, logout, no private reads before authorization. Supabase HTTP responses mocked.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
