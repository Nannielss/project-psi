<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" suppressHydrationWarning>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>Velocity Kinetic</title>
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
        <meta name="theme-color" content="#5a6798">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
