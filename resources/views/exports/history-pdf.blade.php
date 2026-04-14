<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Riwayat Inventory Report</title>
    <style>
        :root {
            --ink: #1e293b;
            --muted: #64748b;
            --line: #d9e2f0;
            --soft: #f8fbff;
            --primary: #49578d;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: "Segoe UI", Arial, sans-serif;
            color: var(--ink);
            background: #eef4fb;
        }
        .page {
            max-width: 1100px;
            margin: 0 auto;
            padding: 32px;
            background: white;
        }
        .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            align-items: flex-start;
            margin-bottom: 28px;
        }
        .eyebrow {
            font-size: 11px;
            letter-spacing: .24em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 10px;
        }
        h1 {
            font-size: 34px;
            margin: 0 0 8px;
            color: var(--primary);
        }
        .copy {
            margin: 0;
            font-size: 14px;
            line-height: 1.7;
            color: var(--muted);
            max-width: 650px;
        }
        .stamp {
            min-width: 220px;
            padding: 18px 20px;
            border: 1px solid var(--line);
            border-radius: 20px;
            background: var(--soft);
        }
        .stamp strong {
            display: block;
            font-size: 13px;
            margin-bottom: 6px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 26px;
        }
        .metric {
            padding: 16px 18px;
            border: 1px solid var(--line);
            border-radius: 18px;
            background: var(--soft);
        }
        .metric .label {
            font-size: 11px;
            color: var(--muted);
            text-transform: uppercase;
            letter-spacing: .18em;
        }
        .metric .value {
            margin-top: 10px;
            font-size: 25px;
            font-weight: 700;
            color: var(--primary);
        }
        .section {
            margin-top: 28px;
        }
        .section h2 {
            margin: 0 0 12px;
            font-size: 18px;
            color: var(--ink);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid var(--line);
            border-radius: 16px;
            overflow: hidden;
        }
        thead th {
            background: #f6f8fc;
            color: var(--muted);
            font-size: 11px;
            letter-spacing: .14em;
            text-transform: uppercase;
            text-align: left;
            padding: 12px 14px;
            border-bottom: 1px solid var(--line);
        }
        tbody td {
            padding: 12px 14px;
            font-size: 13px;
            border-bottom: 1px solid #edf2f7;
            vertical-align: top;
        }
        tbody tr:last-child td {
            border-bottom: none;
        }
        .muted {
            color: var(--muted);
        }
        @media print {
            body {
                background: white;
            }
            .page {
                max-width: none;
                padding: 0;
            }
        }
        @media (max-width: 900px) {
            .summary {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            .header {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div>
                <div class="eyebrow">Inventory Audit Report</div>
                <h1>Riwayat Transaksi Gudang</h1>
                <p class="copy">Ringkasan aktivitas restock, penyesuaian stok, dan penjualan. Halaman ini disiapkan untuk dicetak atau disimpan menjadi PDF dari browser.</p>
            </div>
            <div class="stamp">
                <strong>Generated At</strong>
                <div class="muted">{{ $generatedAt->format('d M Y H:i') }} WIB</div>
            </div>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="label">Total Item</div>
                <div class="value">{{ number_format($summary['total_items']) }}</div>
            </div>
            <div class="metric">
                <div class="label">Lokasi</div>
                <div class="value">{{ number_format($summary['locations']) }}</div>
            </div>
            <div class="metric">
                <div class="label">Restock</div>
                <div class="value">{{ number_format($summary['restock_count']) }}</div>
            </div>
            <div class="metric">
                <div class="label">Volume 30 Hari</div>
                <div class="value">Rp {{ number_format($summary['volume_30_days'], 0, ',', '.') }}</div>
            </div>
        </div>

        <div class="section">
            <h2>Riwayat Penjualan</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tanggal</th>
                        <th>Pelanggan</th>
                        <th>User</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($sales as $sale)
                        <tr>
                            <td>SAL-{{ $sale->id }}</td>
                            <td>{{ optional($sale->created_at)->format('d M Y H:i') }}</td>
                            <td>{{ $sale->customer->shop_name ?? 'Walk-in Customer' }}</td>
                            <td>{{ $sale->user->username ?? '-' }}</td>
                            <td>Rp {{ number_format((float) $sale->total_amount, 0, ',', '.') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="muted">Belum ada data penjualan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Riwayat Restock</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tanggal</th>
                        <th>Barang</th>
                        <th>User</th>
                        <th>Qty</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($restocks as $entry)
                        <tr>
                            <td>TRX-{{ $entry->id }}</td>
                            <td>{{ optional($entry->created_at)->format('d M Y H:i') }}</td>
                            <td>{{ $entry->item->nama_barang ?? 'Barang' }}</td>
                            <td>{{ $entry->user->username ?? '-' }}</td>
                            <td>{{ $entry->quantity }} {{ $entry->item->satuan ?? '' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="muted">Belum ada data restock.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2>Penyesuaian Stok</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tanggal</th>
                        <th>Barang</th>
                        <th>User</th>
                        <th>Qty</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($adjustments as $entry)
                        <tr>
                            <td>ADJ-{{ $entry->id }}</td>
                            <td>{{ optional($entry->created_at)->format('d M Y H:i') }}</td>
                            <td>{{ $entry->item->nama_barang ?? 'Barang' }}</td>
                            <td>{{ $entry->user->username ?? '-' }}</td>
                            <td>{{ $entry->quantity }} {{ $entry->item->satuan ?? '' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="muted">Belum ada data penyesuaian stok.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    @if ($autoPrint)
        <script>
            window.addEventListener('load', function () {
                window.print();
            });
        </script>
    @endif
</body>
</html>
