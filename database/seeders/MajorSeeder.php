<?php

namespace Database\Seeders;

use App\Models\Major;
use Illuminate\Database\Seeder;

class MajorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $majors = [
            [
                'kode' => 'TP',
                'name' => 'Teknik Pemesinan',
            ],
            [
                'kode' => 'TE',
                'name' => 'Teknik Elektronika',
            ],
            [
                'kode' => 'TK',
                'name' => 'Teknik Ketenagalistrikan',
            ],
            [
                'kode' => 'TKR',
                'name' => 'Teknik Kendaraan Ringan',
            ],
            [
                'kode' => 'NKN',
                'name' => 'Nautika Kapal Niaga',
            ],
            [
                'kode' => 'TKN',
                'name' => 'Teknika Kapal Niaga',
            ],
        ];

        foreach ($majors as $major) {
            Major::updateOrCreate(
                ['kode' => $major['kode']],
                $major
            );
        }
    }
}
