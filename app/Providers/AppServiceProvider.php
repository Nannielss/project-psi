<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Custom rate limiter for verifyBorrower endpoint to prevent NIP enumeration
        RateLimiter::for('verify-borrower', function (Request $request) {
            // Limit to 7 attempts per minute per IP address
            // This prevents brute force attacks on NIS/NIP enumeration
            return Limit::perMinute(10)->by($request->ip());
        });
    }
}
