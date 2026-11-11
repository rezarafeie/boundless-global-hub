import { normalizePhone } from './call-phone.ts'
Deno.test('Iranian mobile variants share canonical phone', () => {
  for (const input of ['09123456789','+989123456789','989123456789','00989123456789','9123456789','۰۹۱۲۳۴۵۶۷۸۹','٠٩١٢٣٤٥٦٧٨٩']) {
    if (normalizePhone(input).normalized !== '989123456789') throw new Error(input)
  }
})
Deno.test('empty, extension, landline, international', () => {
  for (const [input, expected] of [['',null],['abc',null],['123','123'],['02112345678','982112345678'],['00442012345678','442012345678']]) {
    if (normalizePhone(input).normalized !== expected) throw new Error(String(input))
  }
})
