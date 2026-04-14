<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Struk SALE-{{ $sale->id }}</title>
    <style>
        :root {
            --paper-width: 58mm;
            --paper-padding-top: 3mm;
            --paper-padding-right: 3mm;
            --paper-padding-bottom: 4mm;
            --paper-padding-left: 3mm;
            --ink: #111827;
            --muted: #6b7280;
            --line: #d1d5db;
        }

        @page {
            size: 58mm auto;
            margin: var(--paper-padding-top) var(--paper-padding-right) var(--paper-padding-bottom) var(--paper-padding-left);
        }

        * {
            box-sizing: border-box;
        }

        html, body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            color: var(--ink);
            font-family: "Consolas", "Courier New", monospace;
            font-size: 10.5px;
            line-height: 1.35;
            width: var(--paper-width);
        }

        body {
            padding: var(--paper-padding-top) var(--paper-padding-right) var(--paper-padding-bottom) var(--paper-padding-left);
        }

        .receipt {
            width: 100%;
        }

        .center {
            text-align: center;
        }

        .brand {
            font-size: 15px;
            font-weight: 700;
            letter-spacing: 0.02em;
        }
        .brand-logo {
            display: block;
            width: 18mm;
            max-height: 18mm;
            margin: 0 auto 3mm;
            object-fit: contain;
        }

        .subtle {
            color: var(--muted);
            font-size: 9.5px;
        }

        .divider {
            border-top: 1px dashed var(--line);
            margin: 7px 0;
        }

        .block {
            margin-bottom: 6px;
        }

        .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }

        .row .label {
            color: var(--muted);
        }

        .row .value {
            text-align: right;
        }

        .item {
            margin-bottom: 7px;
        }

        .item-name {
            font-weight: 700;
            word-break: break-word;
        }

        .item-meta {
            color: var(--muted);
            font-size: 9.5px;
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-top: 2px;
        }

        .totals .row {
            margin-bottom: 4px;
        }

        .grand-total {
            font-size: 12px;
            font-weight: 700;
        }

        .thanks {
            margin-top: 10px;
            font-size: 9.5px;
        }

        .foot-space {
            height: 6mm;
        }

        @media screen {
            body {
                margin: 12px auto;
                box-shadow: 0 0 0 1px #e5e7eb;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="center block">
            @if (!empty($branding['logo_url']))
                <img src="{{ $branding['logo_url'] }}" alt="{{ $branding['business_name'] }}" class="brand-logo">
            @endif
            <div class="brand">{{ strtoupper($branding['business_name'] ?? 'VELOCITY KINETIC') }}</div>
            <div class="subtle">{{ $branding['business_tagline'] ?? 'Warehouse POS & Inventory' }}</div>
            <div class="subtle">{{ $branding['business_address'] ?? 'Jl. Gudang Digital No. 58' }}</div>
            <div class="subtle">Telp. {{ $branding['business_phone'] ?? '0812-0000-5800' }}</div>
        </div>

        <div class="divider"></div>

        <div class="block">
            <div class="row">
                <span class="label">No</span>
                <span class="value">SALE-{{ $sale->id }}</span>
            </div>
            <div class="row">
                <span class="label">Tanggal</span>
                <span class="value">{{ optional($sale->created_at)->timezone('Asia/Jakarta')->format('d/m/Y H:i') }}</span>
            </div>
            <div class="row">
                <span class="label">Kasir</span>
                <span class="value">{{ $sale->user->name ?? $sale->user->username ?? '-' }}</span>
            </div>
            <div class="row">
                <span class="label">Pelanggan</span>
                <span class="value">{{ $sale->customer->shop_name ?? 'Walk-in Customer' }}</span>
            </div>
            <div class="row">
                <span class="label">Tipe</span>
                <span class="value">{{ ($sale->customer_mode ?? 'non_member') === 'member' ? 'Member' : 'Non Member' }}</span>
            </div>
        </div>

        <div class="divider"></div>

        <div class="block">
            @foreach ($sale->items as $line)
                <div class="item">
                    <div class="item-name">{{ $line->item->nama_barang ?? 'Item' }}</div>
                    <div class="item-meta">
                        <span>{{ number_format((float) $line->price, 0, ',', '.') }} x {{ $line->quantity }} {{ $line->item->satuan ?? '' }}</span>
                        <span>Rp {{ number_format((float) $line->subtotal, 0, ',', '.') }}</span>
                    </div>
                </div>
            @endforeach
        </div>

        <div class="divider"></div>

        <div class="totals block">
            <div class="row">
                <span class="label">Metode</span>
                <span class="value">{{ strtoupper($sale->payment_method ?? 'cash') }}</span>
            </div>
            <div class="row">
                <span class="label">Subtotal</span>
                <span class="value">Rp {{ number_format((float) ($sale->subtotal_amount ?? $sale->total_amount), 0, ',', '.') }}</span>
            </div>
            <div class="row">
                <span class="label">Diskon</span>
                <span class="value">
                    @if (($sale->discount_type ?? 'nominal') === 'percent')
                        {{ rtrim(rtrim(number_format((float) ($sale->discount_value ?? 0), 2, ',', '.'), '0'), ',') }}%
                    @else
                        Rp {{ number_format((float) ($sale->discount_value ?? 0), 0, ',', '.') }}
                    @endif
                </span>
            </div>
            <div class="row">
                <span class="label">Potongan</span>
                <span class="value">Rp {{ number_format((float) ($sale->discount_amount ?? 0), 0, ',', '.') }}</span>
            </div>
            <div class="row grand-total">
                <span>Total</span>
                <span>Rp {{ number_format((float) $sale->total_amount, 0, ',', '.') }}</span>
            </div>
            <div class="row">
                <span class="label">Bayar</span>
                <span class="value">Rp {{ number_format((float) ($sale->cash_received ?? $sale->total_amount), 0, ',', '.') }}</span>
            </div>
            <div class="row">
                <span class="label">Kembali</span>
                <span class="value">Rp {{ number_format((float) ($sale->change_amount ?? 0), 0, ',', '.') }}</span>
            </div>
        </div>

        <div class="divider"></div>

        <div class="center thanks">
            <div>Terima kasih sudah berbelanja.</div>
            <div class="subtle">Struk thermal 58mm, margin siap cetak.</div>
            <div class="subtle">Dicetak {{ $printedAt->timezone('Asia/Jakarta')->format('d/m/Y H:i') }} WIB</div>
        </div>

        <div class="foot-space"></div>
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
