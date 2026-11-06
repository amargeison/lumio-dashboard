import test from 'node:test'
import assert from 'node:assert/strict'
import { appFiledDetail, contactBlock, familyFromUnsubscribeToken, namedWithoutConsent, photoGreen, toE164, unsubscribeToken, verifiedSender } from '../../src/lib/impact/comms-rules.ts'
const fam = (o={}) => ({ id:'f1', consent_data:true, consent_photo:true, opt_in_email:true, opt_in_sms:true, opt_in_app:true, unsubscribed_at:null, ...o })
const kid = (o={}) => ({ id:'c1', family_id:'f1', name:'Sam Jones', photo_consent:true, ...o })
test('contact: null consent refused', () => assert.equal(contactBlock(fam({consent_data:null}),'email'),'No contact consent on record'))
test('contact: false consent refused', () => assert.ok(contactBlock(fam({consent_data:false}),'app')))
test('contact: unsubscribed beats consent', () => assert.equal(contactBlock(fam({unsubscribed_at:'2026-01-01'}),'email'),'Unsubscribed'))
test('contact: per-channel opt out', () => { const f=fam({opt_in_sms:false}); assert.ok(contactBlock(f,'sms')); assert.equal(contactBlock(f,'email'),null) })
test('contact: ok', () => assert.equal(contactBlock(fam(),'email'),null))
test('green needs both', () => { assert.equal(photoGreen(fam(),kid()),true); assert.equal(photoGreen(fam({consent_photo:null}),kid()),false); assert.equal(photoGreen(fam(),kid({photo_consent:null})),false); assert.equal(photoGreen(undefined,kid()),false) })
const map = (...fs) => new Map(fs.map(f=>[f.id,f]))
test('names: full name of another family child blocked', () => { const a=fam({id:'a'}), b=fam({id:'b',consent_photo:false}); assert.equal(namedWithoutConsent('Well done sam  jones!',a,map(a,b),[kid({family_id:'b'})]),'Sam Jones') })
test('names: own child first name blocked', () => { const a=fam({consent_photo:false}); assert.equal(namedWithoutConsent('Sam was great',a,map(a),[kid()]),'Sam Jones') })
test('names: other family first name not matched', () => { const a=fam({id:'a'}), b=fam({id:'b',consent_photo:false}); assert.equal(namedWithoutConsent('Will you be there?',a,map(a,b),[kid({family_id:'b',name:'Will Smith'})]),null) })
test('names: green child allowed', () => { const a=fam(); assert.equal(namedWithoutConsent('Sam Jones was great',a,map(a),[kid()]),null) })
test('names: word boundary', () => { const a=fam({consent_photo:false}); assert.equal(namedWithoutConsent('Samantha came',a,map(a),[kid()]),null) })
test('names: unlinked child protected', () => { const a=fam(); assert.equal(namedWithoutConsent('Sam Jones won',a,map(a),[kid({family_id:null})]),'Sam Jones') })
test('names: regex chars safe', () => { const a=fam({consent_photo:false}); assert.equal(namedWithoutConsent('hi',a,map(a),[kid({name:'A(b [c'})]),null) })
test('sender', () => { const c='{"ten-project":"hello@tenproject.org.uk"}'; assert.equal(verifiedSender('ten-project',c),'hello@tenproject.org.uk'); assert.equal(verifiedSender('lumio-test',c),null); assert.equal(verifiedSender('x',undefined),null); assert.equal(verifiedSender('x','{bad'),null); assert.equal(verifiedSender('x','{"x":"a b@c.d"}'),null) })
test('phone: UK mobile forms', () => { for (const n of ['07700 900123','07700900123','+447700900123','+44 7700 900123','+44 (0)7700 900123','00447700900123','447700900123','07700-900-123']) assert.equal(toE164(n),'+447700900123',n) })
test('phone: other international kept', () => assert.equal(toE164('+1 415 555 2671'),'+14155552671'))
test('phone: not textable refused', () => { for (const n of ['','0208 123 4567','+442081234567','0770090012','077009001234','hello']) assert.equal(toE164(n),null,n) })
const ID='6f1c2c3e-1a2b-4c3d-8e9f-0123456789ab', ID2='7f1c2c3e-1a2b-4c3d-8e9f-0123456789ab'
test('unsubscribe: round trip', () => assert.equal(familyFromUnsubscribeToken(unsubscribeToken(ID,'s'),'s'),ID))
test('unsubscribe: wrong secret refused', () => assert.equal(familyFromUnsubscribeToken(unsubscribeToken(ID,'s'),'other'),null))
test('unsubscribe: token cannot be moved to another family', () => { const sig=unsubscribeToken(ID,'s').split('.')[1]; assert.equal(familyFromUnsubscribeToken(`${ID2}.${sig}`,'s'),null) })
test('unsubscribe: malformed refused', () => { for (const t of ['',ID,`${ID}.`,'a.b',`${ID}.x.y`]) assert.equal(familyFromUnsubscribeToken(t,'s'),null,t) })
test('unsubscribe: no secret refuses everything', () => assert.equal(familyFromUnsubscribeToken(unsubscribeToken(ID,''),''),null))
test('app status: live, a family with an accepted login has it in the app', t => {
  t.after(() => { delete process.env.FAMILY_APP_LIVE })
  process.env.FAMILY_APP_LIVE = 'on'
  assert.equal(appFiledDetail(true), 'In the family app')
})
test('app status: live, a family with no login is told apart', t => {
  t.after(() => { delete process.env.FAMILY_APP_LIVE })
  process.env.FAMILY_APP_LIVE = 'on'
  assert.equal(appFiledDetail(false), 'Saved for the family app — no login yet')
})
test('app status: off, unset or any other value keeps the can’t open yet wording', t => {
  t.after(() => { delete process.env.FAMILY_APP_LIVE })
  const waiting = 'Saved for the family app, which families can’t open yet'
  delete process.env.FAMILY_APP_LIVE
  assert.equal(appFiledDetail(true), waiting)
  for (const v of ['off', 'true', '1', 'ON', '']) { process.env.FAMILY_APP_LIVE = v; assert.equal(appFiledDetail(true), waiting); assert.equal(appFiledDetail(false), waiting) }
})
