<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $userData = null;
        if ($user) {
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role ?? null,
                'photo' => $user->photo ?? null,
                'avatar' => $user->photo ?? null,
            ];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userData,
            ],
            'branding' => AppSetting::sharedData(),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'access_denied' => $request->session()->get('access_denied'),
                'receipt_url' => $request->session()->get('receipt_url'),
            ],
        ];
    }
}
