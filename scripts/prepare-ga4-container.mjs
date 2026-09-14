import fs from 'node:fs';
import path from 'node:path';

const [source, destination] = process.argv.slice(2);
if (!source || !destination) throw new Error('Usage: node scripts/prepare-ga4-container.mjs <export.json> <output.json>');
const document = JSON.parse(fs.readFileSync(source, 'utf8'));
const container = document.containerVersion;
if (container.container.publicId !== 'GTM-PX42JMRF') throw new Error('Unexpected GTM container');
const template = (key, value) => ({ type: 'TEMPLATE', key, value });
const params = ['user_role', 'signup_method', 'blog_slug', 'blog_category', 'blog_audience', 'blog_path', 'lead_step', 'lead_type', 'cta_label', 'cta_href', 'plan_id', 'plan_name'];
const variables = params.map((name, index) => ({
  name: `DLV - ${name}`, variableId: String(100 + index), type: 'v',
  parameter: [template('name', name), { type: 'INTEGER', key: 'dataLayerVersion', value: '2' }, { type: 'BOOLEAN', key: 'setDefaultValue', value: 'false' }],
}));
const eventSettings = {
  type: 'LIST', key: 'eventSettingsTable', list: params.map((name) => ({
    type: 'MAP', map: [template('parameter', name), template('parameterValue', `{{DLV - ${name}}}`)],
  })),
};
for (const name of ['GA4 - sign_up - Cadastro criado', 'GA4 - begin_lead - Busca por CEP']) {
  const tag = container.tag.find((entry) => entry.name === name);
  if (!tag) throw new Error(`Missing tag: ${name}`);
  tag.parameter = tag.parameter.filter((item) => item.key !== 'eventSettingsTable');
  tag.parameter.push(structuredClone(eventSettings));
}
const events = ['blog_article_view', 'blog_cta_click', 'sign_up_start', 'sign_up_oauth_start', 'view_caregiver_preview', 'search_by_cep', 'view_pricing', 'select_plan', 'start_free_plan', 'begin_checkout', 'checkout_canceled', 'cta_click', 'generate_lead'];
const trigger = {
  triggerId: '200', name: 'Evento - Funil e blog iCuide', type: 'CUSTOM_EVENT',
  customEventFilter: [{ type: 'MATCH_REGEX', parameter: [template('arg0', '{{_event}}'), template('arg1', `^(${events.join('|')})$`)] }],
};
const tag = {
  tagId: '201', name: 'GA4 - Funil e blog iCuide', type: 'gaawe',
  parameter: [
    { type: 'BOOLEAN', key: 'sendEcommerceData', value: 'false' },
    template('eventName', '{{Event}}'), template('measurementIdOverride', 'G-TBTD5CXPZG'), eventSettings,
  ],
  firingTriggerId: ['200'], tagFiringOption: 'ONCE_PER_EVENT',
  monitoringMetadata: { type: 'MAP' }, consentSettings: { consentStatus: 'NOT_SET' },
};
container.variable = [...(container.variable ?? []).filter((entry) => !variables.some((v) => v.name === entry.name)), ...variables];
container.trigger = [...container.trigger.filter((entry) => entry.name !== trigger.name), trigger];
container.tag = [...container.tag.filter((entry) => entry.name !== tag.name), tag];
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, JSON.stringify(document, null, 2) + '\n');
console.log(`Prepared ${container.tag.length} tags, ${container.trigger.length} triggers and ${container.variable.length} variables. Import using Merge / overwrite conflicts.`);
