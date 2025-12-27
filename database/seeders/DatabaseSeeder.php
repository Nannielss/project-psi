<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::create([
            'username' => 'kajur',
            'password' => Hash::make('12345678'),
            'role' => 'kajur',
            'photo' => null, // Will use default photo
        ]);

        User::create([
            'username' => 'guru',
            'password' => Hash::make('12345678'),
            'role' => 'guru',
            'photo' => null, // Will use default photo
        ]);

        $this->call([
            MajorSeeder::class,
        ]);
    }
}
