import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { CartOrderStatus } from '../constants/status.constants'; // adjust path if needed

// YOUR CLIENT ID
const CLIENT_ID = 'b2d91fa1-a01a-4cad-ad32-c818b5b5c0a0';

@Controller('status-codes')
export class StatusController {
  @Get()
  getHtml(@Res() res: Response) {
    const rows = generateHtmlRows();

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Status Codes</title>

<style>
  body { font-family: Arial; padding: 20px; background: #f4f4f4; }
  table { width: 100%; border-collapse: collapse; background: white; }
  th, td { padding: 10px; border: 1px solid #ddd; font-size: 14px; }
  th { background: #222; color: white; }
  tr:nth-child(even) { background: #f9f9f9; }
  .group-row { background: #444 !important; color: #fff; font-weight: bold; font-size: 16px; }
  .client-box {
    background: #222;
    color: #fff;
    padding: 12px;
    margin-bottom: 20px;
    font-size: 16px;
    border-radius: 5px;
  }
</style>

</head>

<body>

  <div class="client-box">
    <strong>Client ID:</strong> ${CLIENT_ID}
  </div>

  <h2>Order Status Codes</h2>

  <table>
    <tr>
      <th>Group</th>
      <th>Code</th>
      <th>Label</th>
      <th>Description</th>
    </tr>

    ${rows}
  </table>
</body>
</html>
`;

    res.type('text/html').send(html);
  }
}

// ======================================================
// Generate HTML rows — TYPESAFE
// ======================================================
function generateHtmlRows(): string {
  const items = Object.values(CartOrderStatus);

  const groups: Record<'C' | 'P' | 'R' | 'F' | 'D' | 'X' | 'S', string> = {
    C: 'Customer',
    P: 'Payment',
    R: 'Restaurant',
    F: 'Fleet',
    D: 'Delivery',
    X: 'Cancellation',
    S: 'System',
  };

  let html = '';
  let lastGroup: string | null = null;

  for (const item of items) {
    const prefix = item.code.charAt(0) as keyof typeof groups;
    const group = groups[prefix] ?? 'Other';

    if (group !== lastGroup) {
      html += `
      <tr class="group-row">
        <td colspan="4">${group} Flow</td>
      </tr>`;
      lastGroup = group;
    }

    html += `
      <tr>
        <td>${group}</td>
        <td>${item.code}</td>
        <td>${item.label}</td>
        <td>${item.description}</td>
      </tr>`;
  }

  return html;
}
