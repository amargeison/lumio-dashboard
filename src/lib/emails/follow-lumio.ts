import { socialLinksEmailHtml } from '@/lib/social-links'

// One line under Lumio's own emails to coaches: where to follow Lumio Sports.
// Text links, not icons — Gmail and Outlook block SVG and often hide images.
// Only on emails Lumio sends to coaches; emails a family gets from their
// academy carry the academy's brand, not ours.
export function followLumioHtml(): string {
  return `<p style="margin:20px 0 0;font-size:12.5px;color:rgba(255,255,255,0.4);line-height:1.7;">
  Follow Lumio Sports for new features and coaching tips: ${socialLinksEmailHtml('rgba(255,255,255,0.7)')}
</p>`
}
