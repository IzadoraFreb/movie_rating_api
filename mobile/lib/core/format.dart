String formatDate(DateTime? date) {
  if (date == null) return '';
  final local = date.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  return '$day/$month/${local.year}';
}

String formatDuration(int? minutes) {
  if (minutes == null) return '';
  final hours = minutes ~/ 60;
  final rest = minutes % 60;
  if (hours == 0) return '${rest}min';
  return '${hours}h${rest.toString().padLeft(2, '0')}';
}

String formatRating(double? value) =>
    value == null ? '—' : value.toStringAsFixed(1).replaceAll('.', ',');