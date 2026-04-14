<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Schema;

class AppSetting extends Model
{
    protected $guarded = ['id'];

    public static function defaults(): array
    {
        return [
            'business_name' => 'Velocity Kinetic',
            'business_tagline' => 'The Digital Atelier',
            'business_address' => 'Jl. Gudang Digital No. 58',
            'business_phone' => '0812-0000-5800',
            'logo_path' => null,
        ];
    }

    public static function current(): ?self
    {
        if (!Schema::hasTable('app_settings')) {
            return null;
        }

        return static::query()->firstOrCreate(['id' => 1], static::defaults());
    }

    public static function sharedData(): array
    {
        $setting = static::current();
        $defaults = static::defaults();

        if (!$setting) {
            return [
                ...$defaults,
                'logo_url' => null,
            ];
        }

        return [
            'business_name' => $setting->business_name ?: $defaults['business_name'],
            'business_tagline' => $setting->business_tagline ?: $defaults['business_tagline'],
            'business_address' => $setting->business_address ?: $defaults['business_address'],
            'business_phone' => $setting->business_phone ?: $defaults['business_phone'],
            'logo_path' => $setting->logo_path,
            'logo_url' => $setting->logo_path ? route('branding.logo', ['filename' => basename($setting->logo_path)]) : null,
        ];
    }
}
