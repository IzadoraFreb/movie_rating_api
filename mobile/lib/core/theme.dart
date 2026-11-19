import 'package:flutter/material.dart';

class AppColors {
  static const background = Color(0xFFF8F7F4);
  static const surface = Colors.white;
  static const foreground = Color(0xFF292925);
  static const muted = Color(0xFF73736B);
  static const border = Color(0xFFDEDED6);
  static const soft = Color(0xFFF2F1EC);
  static const accent = Color(0xFFE43D12);
  static const accentSoft = Color(0xFFFFF0E9);
  static const danger = Color(0xFFAD2945);
  static const star = Color(0xFFF2A60D);
}

const mutedStyle = TextStyle(color: AppColors.muted, fontSize: 13);

ThemeData buildTheme() {
  const scheme = ColorScheme.light(
    primary: AppColors.accent,
    onPrimary: Colors.white,
    secondary: AppColors.accent,
    onSecondary: Colors.white,
    surface: AppColors.surface,
    onSurface: AppColors.foreground,
    error: AppColors.danger,
    outline: AppColors.border,
    surfaceTint: Colors.transparent,
  );
  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(8));

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: AppColors.background,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.foreground,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: AppColors.foreground,
        fontSize: 20,
        fontWeight: FontWeight.w600,
      ),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      backgroundColor: AppColors.surface,
      indicatorColor: AppColors.accentSoft,
    ),
    progressIndicatorTheme:
        const ProgressIndicatorThemeData(color: AppColors.accent),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.accentSoft,
      side: const BorderSide(color: AppColors.border),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      showCheckmark: false,
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        shape: shape,
        minimumSize: const Size(0, 48),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        shape: shape,
        minimumSize: const Size(0, 48),
        foregroundColor: AppColors.foreground,
        side: const BorderSide(color: AppColors.border),
      ),
    ),
  );
}