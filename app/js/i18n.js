// ── Urban Guardian i18n ──────────────────────────────────────
// Usage:
//   t('key')            → string in current language
//   applyI18n()         → apply data-i18n attrs to DOM
//   toggleLang()        → switch EN ↔ ES and re-apply
//   getCurrentLang()    → 'en' | 'es'
//
// HTML attrs:
//   data-i18n="key"             → el.textContent = t(key)
//   data-i18n-html="key"        → el.innerHTML   = t(key)
//   data-i18n-placeholder="key" → el.placeholder = t(key)
//   data-i18n-title="key"       → el.title       = t(key)
// ─────────────────────────────────────────────────────────────

(function() {
  const STORAGE_KEY = 'ug-lang';
  const DEFAULT_LANG = 'en';

  const DICT = {
    en: {
      // ── General ──────────────────────────────────────────
      loading:              'Loading…',
      save:                 'Save',
      cancel:               'Cancel',
      soon:                 'Coming soon',

      // ── Header ───────────────────────────────────────────
      greeting:             'Hello,',

      // ── Map view ─────────────────────────────────────────
      my_location:          'My location',
      where_going:          'Where are you going?',
      go:                   'Go',
      loading_map:          'Loading map…',
      configure_token:      'Set your Mapbox token in firebase-config.js',
      help_btn:             'Help',
      hide_heatmap:         'Hide heatmap',
      show_heatmap:         'Show heatmap',

      // ── Help modal ───────────────────────────────────────
      nearby_guardians:     'Nearby Guardians',
      request_escort:       'Request escort from an active guardian',
      searching_guardians:  'Searching for guardians…',
      no_guardians_nearby:  'No active guardians nearby.',
      no_guardians_sub:     'Activate yourself as a Guardian to help others.',

      // ── Route sheet ──────────────────────────────────────
      choose_route:         'Choose your route',
      route_safest:         'Safest route',
      route_alternative:    'Alternative',
      route_alternative_2:  'Alternative 2',
      route_only_one:       'Only one route found for this destination',
      incidents_near:       'incident(s) reported nearby',

      // ── Long-press popup ─────────────────────────────────
      what_to_do:           'What would you like to do?',
      report_here:          'Report incident',
      how_to_get_there:     'How to get there',
      selected_location:    'Selected location',

      // ── Report view ──────────────────────────────────────
      report_incident:      'Report Incident',
      help_community:       'Help your community by reporting safety concerns',
      incident_type:        'Incident type',
      severity_level:       'Severity level',
      severity_max:         '5 = maximum',
      description_optional: 'Description (optional)',
      describe_briefly:     'Briefly describe the situation…',
      getting_location:     'Getting location…',
      send_report:          'Send report',

      type_lighting:        'Poor lighting',
      type_group:           'Intimidating group',
      type_robbery:         'Robbery / Mugging',
      type_accident:        'Accident',
      type_danger_zone:     'Danger zone',
      type_other:           'Other',

      // ── Guardians view ───────────────────────────────────
      guardian_network:     'Guardian Network',
      active_volunteers:    'Active volunteers accompanying routes in real time',
      activate_guardian:    'Activate as Guardian',
      help_nearby_users:    'Help nearby users',
      active_nearby:        'Active guardians nearby',
      loading_guardians:    'Loading guardians…',
      guardian_active:      'Guardian active',
      accompanying:         'You\'re accompanying your community',

      // ── Profile view ─────────────────────────────────────
      my_stats:             'My Statistics',
      routes_completed:     'Routes completed',
      incidents_reported:   'Incidents reported',
      help_provided:        'Help provided',
      sos_alerts:           'SOS Alerts',
      settings:             'Settings',
      edit_profile:         'Edit profile',
      security_pins:        'Security PINs',
      emergency_contacts:   'Emergency contacts',
      language:             'Language',
      language_current:     '🇬🇧 English',
      logout:               'Log out',
      loading_profile_name: 'Loading…',
      guardian_level:       'Guardian Level',

      // ── Bottom nav ───────────────────────────────────────
      nav_map:              'Map',
      nav_report:           'Report',
      nav_guardians:        'Guardians',
      nav_profile:          'Profile',

      // ── SOS overlay ──────────────────────────────────────
      sos_active_alert:     'ACTIVE ALERT',
      sos_stay_calm:        'Stay calm.<br>Your location is being tracked.',
      sos_enter_pin:        'Enter PIN to deactivate',
      sos_deactivate:       'Deactivate alert',
      sos_wrong_pin:        'Wrong PIN. Try again.',

      // ── Guardian profile sheet ───────────────────────────
      loading_profile:      'Loading profile…',
      profile_not_found:    'Profile not found.',
      profile_load_error:   'Error loading profile.',

      // ── Toast messages ───────────────────────────────────
      toast_confirmed:      'Incident confirmed. Thank you.',
      toast_confirm_err:    'Error confirming.',
      toast_disputed:       'Incident disputed.',
      toast_dispute_err:    'Error disputing.',
      toast_wait_location:  'Wait for your location first',
      toast_no_location:    'Location unavailable',
      toast_no_location_yet:'Location not available yet',
      toast_route_error:    'Could not calculate the route. Check the destination.',
      toast_route_error_s:  'Could not calculate the route.',
      toast_loc_selected:   'Location selected. Report the incident.',
      toast_reported:       'Incident reported successfully',
      toast_report_err:     'Error sending report',
      toast_guardian_on:    'Guardian mode activated',
      toast_guardian_off:   'Guardian mode deactivated',
      toast_sos_off:        'SOS alert deactivated',
      toast_profile_saved:  'Profile updated',
      toast_profile_err:    'Error saving profile',
      toast_pins_saved:     'PINs saved',
      toast_pins_err:       'Error saving PINs',
      toast_pin_required:   'The real PIN is required',
      toast_contacts_saved: 'Contacts saved',
      toast_contacts_err:   'Error saving contacts',

      // ── Auth ─────────────────────────────────────────────
      welcome_back:         'Welcome back',
      sign_in_to_continue:  'Sign in to continue',
      password:             'Password',
      your_password:        'Your password',
      forgot_password:      'Forgot your password?',
      sign_in:              'Sign in',
      signing_in:           'Signing in…',
      continue_google:      'Continue with Google',
      no_account:           'Don\'t have an account?',
      register:             'Sign up',
      create_account:       'Create account',
      creating_account:     'Creating account…',
      already_account:      'Already have an account?',
      sign_in_link:         'Sign in',
      full_name:            'Full name',
      your_name:            'Your name',
      auth_err_generic:     'An error occurred. Try again.',
      auth_err_invalid:     'Incorrect email or password.',
      auth_err_not_found:   'No account with this email.',
      auth_err_too_many:    'Too many attempts. Wait a few minutes.',
      auth_err_email_used:  'This email is already in use.',
      auth_err_weak_pass:   'Password must be at least 6 characters.',

      // ── Incident popup ───────────────────────────────────
      severity_label:       'Severity',
      confirm_incident:     '✓ Confirm',
      dispute_incident:     '✗ Dispute',
      just_now:             'Just now',
      minutes_ago:          'min ago',
      hours_ago:            'h ago',

      // ── Guardian popup / list ─────────────────────────────
      points:               'Points',
      help_short:           'Help',
      reports_short:        'Reports',
      routes_short:         'Routes',
      active:               'Active',
      active_now:           'Active now',
      active_since:         'Active for',
      view_full_profile:    'View full profile',
      request_escort_btn:   'Request escort',
      guardian_active_now:  'Guardian active now',
      available_to_escort:  'Available to accompany routes',
      help_provided_count:  'help sessions provided',
      verified_volunteer:   'Verified volunteer',
      incidents_rep_count:  'incidents reported',
      contributes_safety:   'Contributes to community safety',
      member_since:         'Member since',
      activity:             'Activity',
    },

    es: {
      // ── General ──────────────────────────────────────────
      loading:              'Cargando…',
      save:                 'Guardar',
      cancel:               'Cancelar',
      soon:                 'Próximamente',

      // ── Header ───────────────────────────────────────────
      greeting:             'Hola,',

      // ── Map view ─────────────────────────────────────────
      my_location:          'Mi ubicación',
      where_going:          '¿A dónde vas?',
      go:                   'Ir',
      loading_map:          'Cargando mapa…',
      configure_token:      'Configura tu Mapbox token en firebase-config.js',
      help_btn:             'Ayuda',
      hide_heatmap:         'Ocultar mapa de calor',
      show_heatmap:         'Mostrar mapa de calor',

      // ── Help modal ───────────────────────────────────────
      nearby_guardians:     'Guardians cercanos',
      request_escort:       'Solicita acompañamiento a un guardian activo',
      searching_guardians:  'Buscando guardians…',
      no_guardians_nearby:  'No hay guardians activos cerca.',
      no_guardians_sub:     'Actívate como Guardian para ayudar a otros.',

      // ── Route sheet ──────────────────────────────────────
      choose_route:         'Elige tu ruta',
      route_safest:         'Ruta más segura',
      route_alternative:    'Alternativa',
      route_alternative_2:  'Alternativa 2',
      route_only_one:       'Solo se encontró una ruta disponible para este destino',
      incidents_near:       'incidente(s) reportado(s) cerca',

      // ── Long-press popup ─────────────────────────────────
      what_to_do:           '¿Qué deseas hacer?',
      report_here:          'Reportar incidencia',
      how_to_get_there:     'Cómo llegar',
      selected_location:    'Ubicación seleccionada',

      // ── Report view ──────────────────────────────────────
      report_incident:      'Reportar incidente',
      help_community:       'Ayuda a tu comunidad informando sobre situaciones de riesgo',
      incident_type:        'Tipo de incidente',
      severity_level:       'Nivel de gravedad',
      severity_max:         '5 = máximo',
      description_optional: 'Descripción (opcional)',
      describe_briefly:     'Describe brevemente la situación…',
      getting_location:     'Obteniendo ubicación…',
      send_report:          'Enviar reporte',

      type_lighting:        'Iluminación deficiente',
      type_group:           'Grupo intimidante',
      type_robbery:         'Robo / Atraco',
      type_accident:        'Accidente',
      type_danger_zone:     'Zona peligrosa',
      type_other:           'Otro',

      // ── Guardians view ───────────────────────────────────
      guardian_network:     'Red de Guardians',
      active_volunteers:    'Voluntarios activos que acompañan trayectos en tiempo real',
      activate_guardian:    'Activarme como Guardian',
      help_nearby_users:    'Ayuda a otros usuarios cercanos',
      active_nearby:        'Guardians activos cerca',
      loading_guardians:    'Cargando guardians…',
      guardian_active:      'Guardian activo',
      accompanying:         'Estás acompañando a tu comunidad',

      // ── Profile view ─────────────────────────────────────
      my_stats:             'Mis estadísticas',
      routes_completed:     'Rutas completadas',
      incidents_reported:   'Incidentes reportados',
      help_provided:        'Ayudas prestadas',
      sos_alerts:           'Alertas SOS',
      settings:             'Configuración',
      edit_profile:         'Editar perfil',
      security_pins:        'PINs de seguridad',
      emergency_contacts:   'Contactos de emergencia',
      language:             'Idioma',
      language_current:     '🇪🇸 Español',
      logout:               'Cerrar sesión',
      loading_profile_name: 'Cargando…',
      guardian_level:       'Guardian Nivel',

      // ── Bottom nav ───────────────────────────────────────
      nav_map:              'Mapa',
      nav_report:           'Reportar',
      nav_guardians:        'Guardians',
      nav_profile:          'Perfil',

      // ── SOS overlay ──────────────────────────────────────
      sos_active_alert:     'ALERTA ACTIVA',
      sos_stay_calm:        'Permanece tranquilo/a.<br>Tu ubicación está siendo registrada.',
      sos_enter_pin:        'Introduce PIN para desactivar',
      sos_deactivate:       'Desactivar alerta',
      sos_wrong_pin:        'PIN incorrecto. Inténtalo de nuevo.',

      // ── Guardian profile sheet ───────────────────────────
      loading_profile:      'Cargando perfil…',
      profile_not_found:    'No se encontró el perfil.',
      profile_load_error:   'Error al cargar el perfil.',

      // ── Toast messages ───────────────────────────────────
      toast_confirmed:      'Incidente confirmado. Gracias.',
      toast_confirm_err:    'Error al confirmar.',
      toast_disputed:       'Incidente disputado.',
      toast_dispute_err:    'Error al disputar.',
      toast_wait_location:  'Espera a obtener tu ubicación primero',
      toast_no_location:    'Ubicación no disponible',
      toast_no_location_yet:'Ubicación no disponible aún',
      toast_route_error:    'No se pudo calcular la ruta. Verifica el destino.',
      toast_route_error_s:  'No se pudo calcular la ruta.',
      toast_loc_selected:   'Ubicación seleccionada. Reporta el incidente.',
      toast_reported:       'Incidente reportado correctamente',
      toast_report_err:     'Error al enviar el reporte',
      toast_guardian_on:    'Modo Guardian activado',
      toast_guardian_off:   'Modo Guardian desactivado',
      toast_sos_off:        'Alerta SOS desactivada',
      toast_profile_saved:  'Perfil actualizado',
      toast_profile_err:    'Error al guardar perfil',
      toast_pins_saved:     'PINs guardados',
      toast_pins_err:       'Error al guardar PINs',
      toast_pin_required:   'El PIN real es obligatorio',
      toast_contacts_saved: 'Contactos guardados',
      toast_contacts_err:   'Error al guardar contactos',

      // ── Auth ─────────────────────────────────────────────
      welcome_back:         'Bienvenido de nuevo',
      sign_in_to_continue:  'Inicia sesión para continuar',
      password:             'Contraseña',
      your_password:        'Tu contraseña',
      forgot_password:      '¿Olvidaste tu contraseña?',
      sign_in:              'Iniciar sesión',
      signing_in:           'Entrando…',
      continue_google:      'Continuar con Google',
      no_account:           '¿No tienes cuenta?',
      register:             'Regístrate',
      create_account:       'Crear cuenta',
      creating_account:     'Creando cuenta…',
      already_account:      '¿Ya tienes cuenta?',
      sign_in_link:         'Iniciar sesión',
      full_name:            'Nombre completo',
      your_name:            'Tu nombre',
      auth_err_generic:     'Ocurrió un error. Inténtalo de nuevo.',
      auth_err_invalid:     'Email o contraseña incorrectos.',
      auth_err_not_found:   'No existe una cuenta con este email.',
      auth_err_too_many:    'Demasiados intentos. Espera unos minutos.',
      auth_err_email_used:  'Este email ya está en uso.',
      auth_err_weak_pass:   'La contraseña debe tener al menos 6 caracteres.',

      // ── Incident popup ───────────────────────────────────
      severity_label:       'Gravedad',
      confirm_incident:     '✓ Confirmar',
      dispute_incident:     '✗ Disputar',
      just_now:             'Hace un momento',
      minutes_ago:          'min',
      hours_ago:            'h',

      // ── Guardian popup / list ─────────────────────────────
      points:               'Puntos',
      help_short:           'Ayudas',
      reports_short:        'Reportes',
      routes_short:         'Rutas',
      active:               'Activo',
      active_now:           'Activo ahora',
      active_since:         'Activo hace',
      view_full_profile:    'Ver perfil completo',
      request_escort_btn:   'Solicitar acompañamiento',
      guardian_active_now:  'Guardian activo ahora',
      available_to_escort:  'Disponible para acompañar trayectos',
      help_provided_count:  'ayudas prestadas',
      verified_volunteer:   'Voluntario verificado',
      incidents_rep_count:  'incidentes reportados',
      contributes_safety:   'Contribuye a la seguridad de la comunidad',
      member_since:         'Miembro desde',
      activity:             'Actividad',
    }
  };

  // ── Internal state ───────────────────────────────────────
  let _lang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;

  // ── Public API ───────────────────────────────────────────
  window.t = function(key) {
    return (DICT[_lang] && DICT[_lang][key]) || (DICT[DEFAULT_LANG] && DICT[DEFAULT_LANG][key]) || key;
  };

  window.getCurrentLang = function() { return _lang; };

  window.setLang = function(lang) {
    if (!DICT[lang]) return;
    _lang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    applyI18n();
    // Update language toggle label if present
    const lbl = document.getElementById('lang-toggle-label');
    if (lbl) lbl.textContent = t('language_current');
  };

  window.toggleLang = function() {
    window.setLang(_lang === 'en' ? 'es' : 'en');
  };

  window.applyI18n = function() {
    // textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    // innerHTML (for strings with <br> etc.)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    // placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    // title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    // Update html lang attr
    document.documentElement.lang = _lang;
  };

  // Auto-apply once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.applyI18n);
  } else {
    window.applyI18n();
  }
})();
