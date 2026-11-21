import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_LABELS,
  TEMPLATE_VARIABLES,
  messageTemplateService,
} from './message-template.service'

describe('messageTemplateService', () => {
  it('includes service_order_pengingat template and labels', () => {
    expect(TEMPLATE_LABELS.service_order_pengingat).toBe(
      'Service Order (Pengingat Pengambilan)',
    )
    expect(TEMPLATE_VARIABLES.service_order_pengingat).toContain('customer_name')
    expect(TEMPLATE_VARIABLES.service_order_pengingat).toContain('code')
    expect(DEFAULT_TEMPLATES.service_order_pengingat).toContain('PENGINGAT PENGAMBILAN')
  })

  it('renders service_order_pengingat message with interpolated data', async () => {
    const text = await messageTemplateService.render('service_order_pengingat', {
      code: 'SRV-0007',
      customer_name: 'Budi Hartono',
      device: 'MacBook Air M1',
      total: 'Rp 450.000',
      paid: 'Rp 450.000',
      remaining: 'Rp 0',
      warranty: '30 hari',
    })

    expect(text).toContain('SRV-0007')
    expect(text).toContain('Budi Hartono')
    expect(text).toContain('MacBook Air M1')
    expect(text).toContain('Rp 450.000')
    expect(text).toContain('30 hari')
  })
})
