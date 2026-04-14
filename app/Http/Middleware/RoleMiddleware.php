<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        if (!in_array($user->role, $roles)) {
            $previousUrl = url()->previous();
            $fallbackUrl = route('dashboard');
            $redirectUrl = !$previousUrl || $previousUrl === $request->fullUrl()
                ? $fallbackUrl
                : $previousUrl;

            return redirect()->to($redirectUrl)
                ->with('access_denied', 'Anda tidak berhak mengakses halaman ini.');
        }

        return $next($request);
    }
}
