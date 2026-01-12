// Multi-Language Support Service
// Supports 19 languages: 11 South African languages + Hindi, Tamil, Arabic + International

export type Language = 
  // International
  | 'en'  // English
  | 'es'  // Spanish
  | 'fr'  // French
  | 'de'  // German
  | 'zh'  // Chinese
  // South African Official Languages (11)
  | 'af'  // Afrikaans
  | 'zu'  // isiZulu
  | 'xh'  // isiXhosa
  | 'st'  // Sesotho
  | 'tn'  // Setswana
  | 'ss'  // siSwati
  | 'ts'  // Xitsonga
  | 've'  // Tshivenda
  | 'nr'  // isiNdebele
  | 'ns'  // Sepedi
  // Additional Languages
  | 'hi'  // Hindi
  | 'ta'  // Tamil
  | 'ar'; // Arabic

export interface Translation {
  [key: string]: string | Translation;
}

const translations: Record<Language, Translation> = {
  // English
  en: {
    common: {
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      submit: 'Submit',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      home: 'Home',
      profile: 'Profile',
      settings: 'Settings',
      help: 'Help'
    },
    nav: {
      home: 'Home',
      voting: 'Voting',
      meetings: 'Meetings',
      proxy: 'Proxy Assignment',
      admin: 'Admin Dashboard',
      auditor: 'Auditor Portal',
      checkIn: 'Check-In'
    },
    voting: {
      title: 'Voting Dashboard',
      candidates: 'Candidate Voting',
      resolutions: 'Resolution Voting',
      castVote: 'Cast Your Vote',
      voteFor: 'Vote For',
      voteAgainst: 'Vote Against',
      abstain: 'Abstain',
      voteSubmitted: 'Your vote has been submitted successfully',
      voteVerification: 'Vote Verification',
      verifyCode: 'Enter verification code'
    },
    meetings: {
      title: 'Meeting Management',
      upcoming: 'Upcoming Meetings',
      past: 'Past Meetings',
      create: 'Create Meeting',
      join: 'Join Meeting',
      checkIn: 'Check In',
      quorumMet: 'Quorum Met',
      quorumNotMet: 'Quorum Not Met',
      attendees: 'Attendees',
      agenda: 'Agenda',
      minutes: 'Meeting Minutes'
    },
    proxy: {
      title: 'Proxy Assignment',
      assignProxy: 'Assign Proxy',
      proxyType: 'Proxy Type',
      discretionary: 'Discretionary',
      instructional: 'Instructional',
      selectProxy: 'Select Proxy Holder',
      duration: 'Duration',
      instructions: 'Voting Instructions'
    },
    admin: {
      dashboard: 'Admin Dashboard',
      users: 'User Management',
      candidates: 'Candidate Management',
      resolutions: 'Resolution Management',
      audit: 'Audit Logs',
      reports: 'Reports',
      export: 'Export Data'
    },
    messages: {
      welcome: 'Welcome to WeVote',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed. Please check your credentials.',
      checkInSuccess: 'Successfully checked in!',
      quorumReached: 'Quorum has been reached',
      votingStarted: 'Voting has started',
      votingEnded: 'Voting has ended',
      sessionExpired: 'Your session has expired. Please login again.'
    }
  },

  // Spanish (Español)
  es: {
    common: {
      login: 'Iniciar sesión',
      logout: 'Cerrar sesión',
      register: 'Registrarse',
      submit: 'Enviar',
      cancel: 'Cancelar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      search: 'Buscar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      back: 'Atrás',
      next: 'Siguiente',
      finish: 'Finalizar',
      home: 'Inicio',
      profile: 'Perfil',
      settings: 'Configuración',
      help: 'Ayuda'
    },
    nav: {
      home: 'Inicio',
      voting: 'Votación',
      meetings: 'Reuniones',
      proxy: 'Asignación de Proxy',
      admin: 'Panel de Administración',
      auditor: 'Portal de Auditoría',
      checkIn: 'Registro'
    },
    voting: {
      title: 'Panel de Votación',
      candidates: 'Votación de Candidatos',
      resolutions: 'Votación de Resoluciones',
      castVote: 'Emitir tu Voto',
      voteFor: 'Votar a Favor',
      voteAgainst: 'Votar en Contra',
      abstain: 'Abstenerse',
      voteSubmitted: 'Tu voto ha sido enviado exitosamente',
      voteVerification: 'Verificación de Voto',
      verifyCode: 'Ingrese código de verificación'
    },
    meetings: {
      title: 'Gestión de Reuniones',
      upcoming: 'Próximas Reuniones',
      past: 'Reuniones Pasadas',
      create: 'Crear Reunión',
      join: 'Unirse a Reunión',
      checkIn: 'Registrarse',
      quorumMet: 'Quórum Alcanzado',
      quorumNotMet: 'Quórum No Alcanzado',
      attendees: 'Asistentes',
      agenda: 'Agenda',
      minutes: 'Acta de Reunión'
    },
    proxy: {
      title: 'Asignación de Proxy',
      assignProxy: 'Asignar Proxy',
      proxyType: 'Tipo de Proxy',
      discretionary: 'Discrecional',
      instructional: 'Instruccional',
      selectProxy: 'Seleccionar Representante',
      duration: 'Duración',
      instructions: 'Instrucciones de Votación'
    },
    admin: {
      dashboard: 'Panel de Administración',
      users: 'Gestión de Usuarios',
      candidates: 'Gestión de Candidatos',
      resolutions: 'Gestión de Resoluciones',
      audit: 'Registros de Auditoría',
      reports: 'Informes',
      export: 'Exportar Datos'
    },
    messages: {
      welcome: 'Bienvenido a WeVote',
      loginSuccess: 'Inicio de sesión exitoso',
      loginFailed: 'Error al iniciar sesión. Verifique sus credenciales.',
      checkInSuccess: '¡Registro exitoso!',
      quorumReached: 'Se ha alcanzado el quórum',
      votingStarted: 'La votación ha comenzado',
      votingEnded: 'La votación ha terminado',
      sessionExpired: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
    }
  },

  // French (Français)
  fr: {
    common: {
      login: 'Se connecter',
      logout: 'Se déconnecter',
      register: "S'inscrire",
      submit: 'Soumettre',
      cancel: 'Annuler',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      search: 'Rechercher',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      back: 'Retour',
      next: 'Suivant',
      finish: 'Terminer',
      home: 'Accueil',
      profile: 'Profil',
      settings: 'Paramètres',
      help: 'Aide'
    },
    nav: {
      home: 'Accueil',
      voting: 'Vote',
      meetings: 'Réunions',
      proxy: 'Attribution de Procuration',
      admin: "Tableau de bord d'administration",
      auditor: "Portail d'audit",
      checkIn: 'Enregistrement'
    },
    voting: {
      title: 'Tableau de bord de vote',
      candidates: 'Vote des candidats',
      resolutions: 'Vote des résolutions',
      castVote: 'Voter',
      voteFor: 'Voter pour',
      voteAgainst: 'Voter contre',
      abstain: "S'abstenir",
      voteSubmitted: 'Votre vote a été soumis avec succès',
      voteVerification: 'Vérification du vote',
      verifyCode: 'Entrez le code de vérification'
    },
    meetings: {
      title: 'Gestion des réunions',
      upcoming: 'Réunions à venir',
      past: 'Réunions passées',
      create: 'Créer une réunion',
      join: 'Rejoindre la réunion',
      checkIn: "S'enregistrer",
      quorumMet: 'Quorum atteint',
      quorumNotMet: 'Quorum non atteint',
      attendees: 'Participants',
      agenda: 'Ordre du jour',
      minutes: 'Procès-verbal'
    },
    proxy: {
      title: 'Attribution de procuration',
      assignProxy: 'Attribuer une procuration',
      proxyType: 'Type de procuration',
      discretionary: 'Discrétionnaire',
      instructional: 'Avec instructions',
      selectProxy: 'Sélectionner le mandataire',
      duration: 'Durée',
      instructions: 'Instructions de vote'
    },
    admin: {
      dashboard: "Tableau de bord d'administration",
      users: 'Gestion des utilisateurs',
      candidates: 'Gestion des candidats',
      resolutions: 'Gestion des résolutions',
      audit: "Journaux d'audit",
      reports: 'Rapports',
      export: 'Exporter les données'
    },
    messages: {
      welcome: 'Bienvenue sur WeVote',
      loginSuccess: 'Connexion réussie',
      loginFailed: 'Échec de la connexion. Veuillez vérifier vos identifiants.',
      checkInSuccess: 'Enregistrement réussi!',
      quorumReached: 'Le quorum a été atteint',
      votingStarted: 'Le vote a commencé',
      votingEnded: 'Le vote est terminé',
      sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.'
    }
  },

  // German (Deutsch)
  de: {
    common: {
      login: 'Anmelden',
      logout: 'Abmelden',
      register: 'Registrieren',
      submit: 'Absenden',
      cancel: 'Abbrechen',
      save: 'Speichern',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      search: 'Suchen',
      loading: 'Lädt...',
      error: 'Fehler',
      success: 'Erfolg',
      confirm: 'Bestätigen',
      yes: 'Ja',
      no: 'Nein',
      back: 'Zurück',
      next: 'Weiter',
      finish: 'Fertig',
      home: 'Startseite',
      profile: 'Profil',
      settings: 'Einstellungen',
      help: 'Hilfe'
    },
    nav: {
      home: 'Startseite',
      voting: 'Abstimmung',
      meetings: 'Besprechungen',
      proxy: 'Vollmacht zuweisen',
      admin: 'Admin-Dashboard',
      auditor: 'Prüfungsportal',
      checkIn: 'Einchecken'
    },
    voting: {
      title: 'Abstimmungs-Dashboard',
      candidates: 'Kandidatenabstimmung',
      resolutions: 'Beschlussabstimmung',
      castVote: 'Stimme abgeben',
      voteFor: 'Dafür stimmen',
      voteAgainst: 'Dagegen stimmen',
      abstain: 'Enthalten',
      voteSubmitted: 'Ihre Stimme wurde erfolgreich abgegeben',
      voteVerification: 'Stimmverifizierung',
      verifyCode: 'Verifizierungscode eingeben'
    },
    meetings: {
      title: 'Besprechungsverwaltung',
      upcoming: 'Bevorstehende Besprechungen',
      past: 'Vergangene Besprechungen',
      create: 'Besprechung erstellen',
      join: 'An Besprechung teilnehmen',
      checkIn: 'Einchecken',
      quorumMet: 'Beschlussfähigkeit erreicht',
      quorumNotMet: 'Beschlussfähigkeit nicht erreicht',
      attendees: 'Teilnehmer',
      agenda: 'Tagesordnung',
      minutes: 'Protokoll'
    },
    proxy: {
      title: 'Vollmachtszuweisung',
      assignProxy: 'Vollmacht zuweisen',
      proxyType: 'Vollmachtstyp',
      discretionary: 'Nach Ermessen',
      instructional: 'Mit Anweisungen',
      selectProxy: 'Bevollmächtigten auswählen',
      duration: 'Dauer',
      instructions: 'Abstimmungsanweisungen'
    },
    admin: {
      dashboard: 'Admin-Dashboard',
      users: 'Benutzerverwaltung',
      candidates: 'Kandidatenverwaltung',
      resolutions: 'Beschlussverwaltung',
      audit: 'Prüfprotokolle',
      reports: 'Berichte',
      export: 'Daten exportieren'
    },
    messages: {
      welcome: 'Willkommen bei WeVote',
      loginSuccess: 'Anmeldung erfolgreich',
      loginFailed: 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.',
      checkInSuccess: 'Erfolgreich eingecheckt!',
      quorumReached: 'Beschlussfähigkeit wurde erreicht',
      votingStarted: 'Abstimmung hat begonnen',
      votingEnded: 'Abstimmung ist beendet',
      sessionExpired: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.'
    }
  },

  // Chinese (中文)
  zh: {
    common: {
      login: '登录',
      logout: '退出',
      register: '注册',
      submit: '提交',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      search: '搜索',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      confirm: '确认',
      yes: '是',
      no: '否',
      back: '返回',
      next: '下一步',
      finish: '完成',
      home: '首页',
      profile: '个人资料',
      settings: '设置',
      help: '帮助'
    },
    nav: {
      home: '首页',
      voting: '投票',
      meetings: '会议',
      proxy: '代理委派',
      admin: '管理面板',
      auditor: '审计门户',
      checkIn: '签到'
    },
    voting: {
      title: '投票仪表板',
      candidates: '候选人投票',
      resolutions: '决议投票',
      castVote: '投票',
      voteFor: '投赞成票',
      voteAgainst: '投反对票',
      abstain: '弃权',
      voteSubmitted: '您的投票已成功提交',
      voteVerification: '投票验证',
      verifyCode: '输入验证码'
    },
    meetings: {
      title: '会议管理',
      upcoming: '即将举行的会议',
      past: '过往会议',
      create: '创建会议',
      join: '加入会议',
      checkIn: '签到',
      quorumMet: '已达到法定人数',
      quorumNotMet: '未达到法定人数',
      attendees: '出席者',
      agenda: '议程',
      minutes: '会议纪要'
    },
    proxy: {
      title: '代理委派',
      assignProxy: '指定代理',
      proxyType: '代理类型',
      discretionary: '自由裁量权',
      instructional: '指示性',
      selectProxy: '选择代理人',
      duration: '持续时间',
      instructions: '投票说明'
    },
    admin: {
      dashboard: '管理面板',
      users: '用户管理',
      candidates: '候选人管理',
      resolutions: '决议管理',
      audit: '审计日志',
      reports: '报告',
      export: '导出数据'
    },
    messages: {
      welcome: '欢迎使用 WeVote',
      loginSuccess: '登录成功',
      loginFailed: '登录失败。请检查您的凭据。',
      checkInSuccess: '签到成功！',
      quorumReached: '已达到法定人数',
      votingStarted: '投票已开始',
      votingEnded: '投票已结束',
      sessionExpired: '您的会话已过期。请重新登录。'
    }
  },

  // Afrikaans
  af: {
    common: {
      login: 'Teken in',
      logout: 'Teken uit',
      register: 'Registreer',
      submit: 'Indien',
      cancel: 'Kanselleer',
      save: 'Stoor',
      delete: 'Verwyder',
      edit: 'Wysig',
      search: 'Soek',
      loading: 'Laai...',
      error: 'Fout',
      success: 'Sukses',
      confirm: 'Bevestig',
      yes: 'Ja',
      no: 'Nee',
      back: 'Terug',
      next: 'Volgende',
      finish: 'Voltooi',
      home: 'Tuis',
      profile: 'Profiel',
      settings: 'Instellings',
      help: 'Hulp'
    },
    nav: {
      home: 'Tuis',
      voting: 'Stemming',
      meetings: 'Vergaderings',
      proxy: 'Volmag Toekenning',
      admin: 'Admin Dashboard',
      auditor: 'Ouditeur Portaal',
      checkIn: 'Teken In'
    },
    voting: {
      title: 'Stem Dashboard',
      candidates: 'Kandidaat Stemming',
      resolutions: 'Resolusie Stemming',
      castVote: 'Gee jou Stem',
      voteFor: 'Stem Vir',
      voteAgainst: 'Stem Teen',
      abstain: 'Onthou',
      voteSubmitted: 'Jou stem is suksesvol ingedien',
      voteVerification: 'Stem Verifikasie',
      verifyCode: 'Voer verifikasie kode in'
    },
    meetings: {
      title: 'Vergadering Bestuur',
      upcoming: 'Komende Vergaderings',
      past: 'Vorige Vergaderings',
      create: 'Skep Vergadering',
      join: 'Sluit aan by Vergadering',
      checkIn: 'Teken In',
      quorumMet: 'Kworum Bereik',
      quorumNotMet: 'Kworum Nie Bereik',
      attendees: 'Bywoners',
      agenda: 'Agenda',
      minutes: 'Notule'
    },
    proxy: {
      title: 'Volmag Toekenning',
      assignProxy: 'Ken Volmag Toe',
      proxyType: 'Volmag Tipe',
      discretionary: 'Diskresionêr',
      instructional: 'Instruksioneel',
      selectProxy: 'Kies Volmaghouer',
      duration: 'Duur',
      instructions: 'Stem Instruksies'
    },
    admin: {
      dashboard: 'Admin Dashboard',
      users: 'Gebruiker Bestuur',
      candidates: 'Kandidaat Bestuur',
      resolutions: 'Resolusie Bestuur',
      audit: 'Oudit Logs',
      reports: 'Verslae',
      export: 'Voer Data Uit'
    },
    messages: {
      welcome: 'Welkom by WeVote',
      loginSuccess: 'Aanmelding suksesvol',
      loginFailed: 'Aanmelding het misluk. Kontroleer asseblief jou geloofsbriewe.',
      checkInSuccess: 'Suksesvol ingeskryf!',
      quorumReached: 'Kworum is bereik',
      votingStarted: 'Stemming het begin',
      votingEnded: 'Stemming is beëindig',
      sessionExpired: 'Jou sessie het verval. Teken asseblief weer aan.'
    }
  },

  // isiZulu
  zu: {
    common: {
      login: 'Ngena ngemvume',
      logout: 'Phuma',
      register: 'Bhalisa',
      submit: 'Thumela',
      cancel: 'Khansela',
      save: 'Londoloza',
      delete: 'Susa',
      edit: 'Hlela',
      search: 'Sesha',
      loading: 'Iyalayisha...',
      error: 'Iphutha',
      success: 'Impumelelo',
      confirm: 'Qinisekisa',
      yes: 'Yebo',
      no: 'Cha',
      back: 'Emuva',
      next: 'Okulandelayo',
      finish: 'Qeda',
      home: 'Ikhaya',
      profile: 'Iphrofayela',
      settings: 'Izilungiselelo',
      help: 'Usizo'
    },
    nav: {
      home: 'Ikhaya',
      voting: 'Ukuvota',
      meetings: 'Imihlangano',
      proxy: 'Ukwabelana Ngommeleli',
      admin: 'I-Dashboard Yomlawuli',
      auditor: 'Isango Lomhloli',
      checkIn: 'Ngena Ngemvume'
    },
    voting: {
      title: 'I-Dashboard Yokuvota',
      candidates: 'Ukuvotela Abahlomuli',
      resolutions: 'Ukuvotela Izinqumo',
      castVote: 'Vota',
      voteFor: 'Vota Ku',
      voteAgainst: 'Vota Ngokumelene',
      abstain: 'Zibambe',
      voteSubmitted: 'Ivoti lakho lithunyelwe ngempumelelo',
      voteVerification: 'Ukuqinisekiswa Kwevoti',
      verifyCode: 'Faka ikhodi yokuqinisekisa'
    },
    meetings: {
      title: 'Ukuphatha Imihlangano',
      upcoming: 'Imihlangano Ezayo',
      past: 'Imihlangano Edlule',
      create: 'Dala Umhlangano',
      join: 'Joyina Umhlangano',
      checkIn: 'Ngena Ngemvume',
      quorumMet: 'I-Quorum Ifinyelelwe',
      quorumNotMet: 'I-Quorum Ayifinyelelwanga',
      attendees: 'Abakhona',
      agenda: 'I-Agenda',
      minutes: 'Iminithisi'
    },
    proxy: {
      title: 'Ukwabelana Ngommeleli',
      assignProxy: 'Nikeza Ummeleli',
      proxyType: 'Uhlobo Lommeleli',
      discretionary: 'Ngokuzikhethela',
      instructional: 'Ngeziyalezo',
      selectProxy: 'Khetha Ummeleli',
      duration: 'Isikhathi',
      instructions: 'Imiyalelo Yokuvota'
    },
    admin: {
      dashboard: 'I-Dashboard Yomlawuli',
      users: 'Ukuphatha Abasebenzisi',
      candidates: 'Ukuphatha Abahlomuli',
      resolutions: 'Ukuphatha Izinqumo',
      audit: 'Amalogi Wokuhlola',
      reports: 'Imibiko',
      export: 'Khipha Idatha'
    },
    messages: {
      welcome: 'Wamukelekile ku-WeVote',
      loginSuccess: 'Ukungena ngemvume kuphumelele',
      loginFailed: 'Ukungena ngemvume kuhlulekile. Sicela uhlole izincwadi zakho zobuqiniso.',
      checkInSuccess: 'Ukungenisa kuphumelele!',
      quorumReached: 'I-quorum ifinyelelwe',
      votingStarted: 'Ukuvota kuqalile',
      votingEnded: 'Ukuvota kuphele',
      sessionExpired: 'Isikhathi sakho siphelelwe. Sicela ungene futhi.'
    }
  },

  // isiXhosa
  xh: {
    common: {
      login: 'Ngena',
      logout: 'Phuma',
      register: 'Bhalisa',
      submit: 'Ngenisa',
      cancel: 'Rhoxisa',
      save: 'Gcina',
      delete: 'Cima',
      edit: 'Hlela',
      search: 'Khangela',
      loading: 'Iyalayisha...',
      error: 'Impazamo',
      success: 'Impumelelo',
      confirm: 'Qinisekisa',
      yes: 'Ewe',
      no: 'Hayi',
      back: 'Emva',
      next: 'Okulandelayo',
      finish: 'Gqiba',
      home: 'Ikhaya',
      profile: 'Iprofayile',
      settings: 'Izicwangciso',
      help: 'Uncedo'
    },
    nav: {
      home: 'Ikhaya',
      voting: 'Ukuvota',
      meetings: 'Iintlanganiso',
      proxy: 'Ukwabelana Ngommeli',
      admin: 'I-Dashboard Yolawulo',
      auditor: 'Isango Lomhloli',
      checkIn: 'Ngena'
    },
    voting: {
      title: 'I-Dashboard Yokuvota',
      candidates: 'Ukuvotela Abagqatswa',
      resolutions: 'Ukuvotela Izigqibo',
      castVote: 'Vota',
      voteFor: 'Vota Ngo',
      voteAgainst: 'Vota Ngxamisekile',
      abstain: 'Zibambe',
      voteSubmitted: 'Ivoti lakho lithunyelwe ngempumelelo',
      voteVerification: 'Ukuqinisekiswa Kwevoti',
      verifyCode: 'Ngenisa ikhowudi yokuqinisekisa'
    },
    meetings: {
      title: 'Ulawulo Lweentlanganiso',
      upcoming: 'Iintlanganiso Ezizayo',
      past: 'Iintlanganiso Ezidlulileyo',
      create: 'Yenza Intlanganiso',
      join: 'Joyina Intlanganiso',
      checkIn: 'Ngena',
      quorumMet: 'I-Quorum Ifunyenwe',
      quorumNotMet: 'I-Quorum Ayifunyanwanga',
      attendees: 'Abakhoyo',
      agenda: 'I-Ajenda',
      minutes: 'Iminithisi'
    },
    proxy: {
      title: 'Ukwabelana Ngommeli',
      assignProxy: 'Nikela Ummeli',
      proxyType: 'Uhlobo Lommeli',
      discretionary: 'Ngokubona',
      instructional: 'Ngemiyalelo',
      selectProxy: 'Khetha Ummeli',
      duration: 'Ubude Bexesha',
      instructions: 'Imiyalelo Yokuvota'
    },
    admin: {
      dashboard: 'I-Dashboard Yolawulo',
      users: 'Ulawulo Lwabasebenzisi',
      candidates: 'Ulawulo Lwabagqatswa',
      resolutions: 'Ulawulo Lwezigqibo',
      audit: 'Iilogi Zokuhlola',
      reports: 'Iingxelo',
      export: 'Khupha Idatha'
    },
    messages: {
      welcome: 'Wamkelekile ku-WeVote',
      loginSuccess: 'Ukungena kuphumelele',
      loginFailed: 'Ukungena kusilele. Nceda uhlole izatifikethi zakho.',
      checkInSuccess: 'Ukungena kuphumelele!',
      quorumReached: 'I-quorum ifunyenwe',
      votingStarted: 'Ukuvota kuqalile',
      votingEnded: 'Ukuvota kuphele',
      sessionExpired: 'Iseshoni yakho iphelelwe lixesha. Nceda ungene kwakhona.'
    }
  },

  // Sesotho
  st: {
    common: {
      login: 'Kena',
      logout: 'Tswa',
      register: 'Ngodisa',
      submit: 'Romella',
      cancel: 'Hlakola',
      save: 'Boloka',
      delete: 'Tlosa',
      edit: 'Fetola',
      search: 'Batla',
      loading: 'E a jara...',
      error: 'Phoso',
      success: 'Katleho',
      confirm: 'Tiisa',
      yes: 'E',
      no: 'Tjhe',
      back: 'Morao',
      next: 'Latelang',
      finish: 'Qetela',
      home: 'Lehae',
      profile: 'Profaele',
      settings: 'Diseletso',
      help: 'Thuso'
    },
    nav: {
      home: 'Lehae',
      voting: 'Ho Vouta',
      meetings: 'Dikopano',
      proxy: 'Kabo ya Moemedi',
      admin: 'Dashboard ya Tsamaiso',
      auditor: 'Monyako wa Mohlahlobi',
      checkIn: 'Kena'
    },
    voting: {
      title: 'Dashboard ya Vouto',
      candidates: 'Ho Vouta Bakgethi',
      resolutions: 'Ho Vouta Diqeto',
      castVote: 'Vouta',
      voteFor: 'Vouta Bakeng',
      voteAgainst: 'Vouta Kgahlanong',
      abstain: 'Ithibele',
      voteSubmitted: 'Vouto ya hao e rometswe ka katleho',
      voteVerification: 'Tlhahlobo ya Vouto',
      verifyCode: 'Kenya khoutu ya tlhahlobo'
    },
    meetings: {
      title: 'Tsamaiso ya Dikopano',
      upcoming: 'Dikopano Tse Tlang',
      past: 'Dikopano Tse Fetileng',
      create: 'Theha Kopano',
      join: 'Kena Kopanong',
      checkIn: 'Kena',
      quorumMet: 'Palo e Fihletswe',
      quorumNotMet: 'Palo Ha e a Fihlela',
      attendees: 'Ba Teng',
      agenda: 'Lenaneo',
      minutes: 'Metsotso'
    },
    proxy: {
      title: 'Kabo ya Moemedi',
      assignProxy: 'Abela Moemedi',
      proxyType: 'Mofuta wa Moemedi',
      discretionary: 'Ka Boikhetho',
      instructional: 'Ka Ditaelo',
      selectProxy: 'Kgetha Moemedi',
      duration: 'Nako',
      instructions: 'Ditaelo tsa Vouto'
    },
    admin: {
      dashboard: 'Dashboard ya Tsamaiso',
      users: 'Tsamaiso ya Basebelisi',
      candidates: 'Tsamaiso ya Bakgethi',
      resolutions: 'Tsamaiso ya Diqeto',
      audit: 'Di-log tsa Tlhahlobo',
      reports: 'Dipegelo',
      export: 'Ntsha Dintlha'
    },
    messages: {
      welcome: 'O amohetswe ho WeVote',
      loginSuccess: 'Ho kena ho atlehile',
      loginFailed: 'Ho kena ho hlolehile. Ka kopo hlahloba ditifikeiti tsa hao.',
      checkInSuccess: 'Ho kena ho atlehile!',
      quorumReached: 'Palo e fihletswe',
      votingStarted: 'Vouto e qadile',
      votingEnded: 'Vouto e fedile',
      sessionExpired: 'Seshen ya hao e fedile. Ka kopo kena hape.'
    }
  },

  // Setswana
  tn: {
    common: {
      login: 'Tsena',
      logout: 'Tswa',
      register: 'Kwadisa',
      submit: 'Romela',
      cancel: 'Khansela',
      save: 'Boloka',
      delete: 'Phimola',
      edit: 'Fetola',
      search: 'Batla',
      loading: 'E a lesa...',
      error: 'Phoso',
      success: 'Katlego',
      confirm: 'Tlhomamisa',
      yes: 'Ee',
      no: 'Nnyaa',
      back: 'Morago',
      next: 'Latelang',
      finish: 'Wetsa',
      home: 'Gae',
      profile: 'Boitsebiso',
      settings: 'Dithulaganyo',
      help: 'Thuso'
    },
    nav: {
      home: 'Gae',
      voting: 'Go Vouta',
      meetings: 'Dikopano',
      proxy: 'Kabo ya Moemedi',
      admin: 'Letlapa la Taolo',
      auditor: 'Kgoro ya Mohlahlobi',
      checkIn: 'Tsena'
    },
    voting: {
      title: 'Letlapa la Vouto',
      candidates: 'Go Voutela Bakgethwa',
      resolutions: 'Go Voutela Ditshwetso',
      castVote: 'Vouta',
      voteFor: 'Vouta Bakeng',
      voteAgainst: 'Vouta Kgatlhanong',
      abstain: 'Ipaakanya',
      voteSubmitted: 'Vouto ya gago e rometswe ka katlego',
      voteVerification: 'Tlhatlhobo ya Vouto',
      verifyCode: 'Tsenya khoutu ya tlhatlhobo'
    },
    meetings: {
      title: 'Taolo ya Dikopano',
      upcoming: 'Dikopano Tse di Tlang',
      past: 'Dikopano Tse di Fetileng',
      create: 'Tlhama Kopano',
      join: 'Tsena mo Kopanong',
      checkIn: 'Tsena',
      quorumMet: 'Palo e Fitlhetswe',
      quorumNotMet: 'Palo Ga e a Fitlhelwa',
      attendees: 'Ba ba Teng',
      agenda: 'Lenaane',
      minutes: 'Metsotso'
    },
    proxy: {
      title: 'Kabo ya Moemedi',
      assignProxy: 'Abela Moemedi',
      proxyType: 'Mofuta wa Moemedi',
      discretionary: 'Ka Boikgethelo',
      instructional: 'Ka Ditaelo',
      selectProxy: 'Tlhopha Moemedi',
      duration: 'Lobaka',
      instructions: 'Ditaelo tsa Vouto'
    },
    admin: {
      dashboard: 'Letlapa la Taolo',
      users: 'Taolo ya Badirisi',
      candidates: 'Taolo ya Bakgethwa',
      resolutions: 'Taolo ya Ditshwetso',
      audit: 'Di-log tsa Tlhatlhobo',
      reports: 'Dipego',
      export: 'Ntsha Tshedimosetso'
    },
    messages: {
      welcome: 'O amogesitse kwa WeVote',
      loginSuccess: 'Go tsena go atlehetseng',
      loginFailed: 'Go tsena go paletse. Tlhola bosupi jwa gago.',
      checkInSuccess: 'Go tsena go atlehile!',
      quorumReached: 'Palo e fitlhetswe',
      votingStarted: 'Vouto e simolotse',
      votingEnded: 'Vouto e wetswe',
      sessionExpired: 'Tiragalo ya gago e fedile. Tsena gape.'
    }
  },

  // Hindi (हिंदी)
  hi: {
    common: {
      login: 'लॉग इन करें',
      logout: 'लॉग आउट करें',
      register: 'पंजीकरण करें',
      submit: 'जमा करें',
      cancel: 'रद्द करें',
      save: 'सहेजें',
      delete: 'हटाएं',
      edit: 'संपादित करें',
      search: 'खोजें',
      loading: 'लोड हो रहा है...',
      error: 'त्रुटि',
      success: 'सफलता',
      confirm: 'पुष्टि करें',
      yes: 'हाँ',
      no: 'नहीं',
      back: 'वापस',
      next: 'अगला',
      finish: 'समाप्त',
      home: 'होम',
      profile: 'प्रोफाइल',
      settings: 'सेटिंग्स',
      help: 'सहायता'
    },
    nav: {
      home: 'होम',
      voting: 'मतदान',
      meetings: 'बैठकें',
      proxy: 'प्रॉक्सी असाइनमेंट',
      admin: 'एडमिन डैशबोर्ड',
      auditor: 'ऑडिटर पोर्टल',
      checkIn: 'चेक-इन'
    },
    voting: {
      title: 'मतदान डैशबोर्ड',
      candidates: 'उम्मीदवार मतदान',
      resolutions: 'संकल्प मतदान',
      castVote: 'अपना वोट डालें',
      voteFor: 'के पक्ष में वोट',
      voteAgainst: 'के विरुद्ध वोट',
      abstain: 'मतदान से बचें',
      voteSubmitted: 'आपका वोट सफलतापूर्वक जमा किया गया',
      voteVerification: 'वोट सत्यापन',
      verifyCode: 'सत्यापन कोड दर्ज करें'
    },
    meetings: {
      title: 'बैठक प्रबंधन',
      upcoming: 'आगामी बैठकें',
      past: 'पिछली बैठकें',
      create: 'बैठक बनाएं',
      join: 'बैठक में शामिल हों',
      checkIn: 'चेक-इन करें',
      quorumMet: 'कोरम पूरा हुआ',
      quorumNotMet: 'कोरम पूरा नहीं हुआ',
      attendees: 'उपस्थित लोग',
      agenda: 'एजेंडा',
      minutes: 'कार्यवृत्त'
    },
    proxy: {
      title: 'प्रॉक्सी असाइनमेंट',
      assignProxy: 'प्रॉक्सी नियुक्त करें',
      proxyType: 'प्रॉक्सी प्रकार',
      discretionary: 'विवेकाधीन',
      instructional: 'निर्देशात्मक',
      selectProxy: 'प्रॉक्सी चुनें',
      duration: 'अवधि',
      instructions: 'मतदान निर्देश'
    },
    admin: {
      dashboard: 'एडमिन डैशबोर्ड',
      users: 'उपयोगकर्ता प्रबंधन',
      candidates: 'उम्मीदवार प्रबंधन',
      resolutions: 'संकल्प प्रबंधन',
      audit: 'ऑडिट लॉग',
      reports: 'रिपोर्ट',
      export: 'डेटा निर्यात करें'
    },
    messages: {
      welcome: 'WeVote में आपका स्वागत है',
      loginSuccess: 'लॉगिन सफल',
      loginFailed: 'लॉगिन विफल। कृपया अपनी साख की जांच करें।',
      checkInSuccess: 'चेक-इन सफल!',
      quorumReached: 'कोरम पूरा हो गया है',
      votingStarted: 'मतदान शुरू हो गया है',
      votingEnded: 'मतदान समाप्त हो गया है',
      sessionExpired: 'आपका सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।'
    }
  },

  // Tamil (தமிழ்)
  ta: {
    common: {
      login: 'உள்நுழைக',
      logout: 'வெளியேறு',
      register: 'பதிவு செய்',
      submit: 'சமர்ப்பிக்கவும்',
      cancel: 'ரத்து செய்',
      save: 'சேமி',
      delete: 'அழி',
      edit: 'திருத்து',
      search: 'தேடு',
      loading: 'ஏற்றுகிறது...',
      error: 'பிழை',
      success: 'வெற்றி',
      confirm: 'உறுதிப்படுத்து',
      yes: 'ஆம்',
      no: 'இல்லை',
      back: 'பின் செல்',
      next: 'அடுத்து',
      finish: 'முடி',
      home: 'முகப்பு',
      profile: 'சுயவிவரம்',
      settings: 'அமைப்புகள்',
      help: 'உதவி'
    },
    nav: {
      home: 'முகப்பு',
      voting: 'வாக்களிப்பு',
      meetings: 'கூட்டங்கள்',
      proxy: 'பதிலாள் நியமனம்',
      admin: 'நிர்வாக பலகை',
      auditor: 'தணிக்கை வாயில்',
      checkIn: 'செக்-இன்'
    },
    voting: {
      title: 'வாக்களிப்பு பலகை',
      candidates: 'வேட்பாளர் வாக்களிப்பு',
      resolutions: 'தீர்மான வாக்களிப்பு',
      castVote: 'உங்கள் வாக்கை பதிவு செய்யவும்',
      voteFor: 'ஆதரவாக வாக்களிக்கவும்',
      voteAgainst: 'எதிராக வாக்களிக்கவும்',
      abstain: 'வாக்களிக்காதீர்கள்',
      voteSubmitted: 'உங்கள் வாக்கு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது',
      voteVerification: 'வாக்கு சரிபார்ப்பு',
      verifyCode: 'சரிபார்ப்பு குறியீட்டை உள்ளிடவும்'
    },
    meetings: {
      title: 'கூட்ட மேலாண்மை',
      upcoming: 'வரவிருக்கும் கூட்டங்கள்',
      past: 'கடந்த கூட்டங்கள்',
      create: 'கூட்டத்தை உருவாக்கவும்',
      join: 'கூட்டத்தில் சேரவும்',
      checkIn: 'செக்-இன் செய்யவும்',
      quorumMet: 'கோரம் அடைந்தது',
      quorumNotMet: 'கோரம் அடையப்படவில்லை',
      attendees: 'வந்தவர்கள்',
      agenda: 'நிகழ்ச்சி நிரல்',
      minutes: 'நிமிட குறிப்புகள்'
    },
    proxy: {
      title: 'பதிலாள் நியமனம்',
      assignProxy: 'பதிலாளை நியமிக்கவும்',
      proxyType: 'பதிலாள் வகை',
      discretionary: 'விருப்பமான',
      instructional: 'வழிகாட்டுதல்',
      selectProxy: 'பதிலாளை தேர்ந்தெடுக்கவும்',
      duration: 'கால அளவு',
      instructions: 'வாக்களிப்பு வழிகாட்டுதல்கள்'
    },
    admin: {
      dashboard: 'நிர்வாக பலகை',
      users: 'பயனர் மேலாண்மை',
      candidates: 'வேட்பாளர் மேலாண்மை',
      resolutions: 'தீர்மான மேலாண்மை',
      audit: 'தணிக்கை பதிவுகள்',
      reports: 'அறிக்கைகள்',
      export: 'தரவை ஏற்றுமதி செய்யவும்'
    },
    messages: {
      welcome: 'WeVote க்கு வரவேற்கிறோம்',
      loginSuccess: 'உள்நுழைவு வெற்றிகரமாக',
      loginFailed: 'உள்நுழைவு தோல்வியுற்றது. உங்கள் சான்றுகளை சரிபார்க்கவும்.',
      checkInSuccess: 'செக்-இன் வெற்றிகரமாக!',
      quorumReached: 'கோரம் அடையப்பட்டது',
      votingStarted: 'வாக்களிப்பு தொடங்கப்பட்டது',
      votingEnded: 'வாக்களிப்பு முடிந்தது',
      sessionExpired: 'உங்கள் அமர்வு காலாவதியாகிவிட்டது. மீண்டும் உள்நுழைக.'
    }
  },

  // Arabic (العربية)
  ar: {
    common: {
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      register: 'التسجيل',
      submit: 'إرسال',
      cancel: 'إلغاء',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      search: 'بحث',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
      confirm: 'تأكيد',
      yes: 'نعم',
      no: 'لا',
      back: 'رجوع',
      next: 'التالي',
      finish: 'إنهاء',
      home: 'الرئيسية',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      help: 'مساعدة'
    },
    nav: {
      home: 'الرئيسية',
      voting: 'التصويت',
      meetings: 'الاجتماعات',
      proxy: 'تعيين الوكيل',
      admin: 'لوحة التحكم',
      auditor: 'بوابة المدقق',
      checkIn: 'تسجيل الحضور'
    },
    voting: {
      title: 'لوحة التصويت',
      candidates: 'تصويت المرشحين',
      resolutions: 'تصويت القرارات',
      castVote: 'أدلي بصوتك',
      voteFor: 'صوت لصالح',
      voteAgainst: 'صوت ضد',
      abstain: 'امتنع',
      voteSubmitted: 'تم إرسال صوتك بنجاح',
      voteVerification: 'التحقق من التصويت',
      verifyCode: 'أدخل رمز التحقق'
    },
    meetings: {
      title: 'إدارة الاجتماعات',
      upcoming: 'الاجتماعات القادمة',
      past: 'الاجتماعات السابقة',
      create: 'إنشاء اجتماع',
      join: 'انضم للاجتماع',
      checkIn: 'تسجيل الحضور',
      quorumMet: 'تم الوصول للنصاب',
      quorumNotMet: 'لم يتم الوصول للنصاب',
      attendees: 'الحاضرون',
      agenda: 'جدول الأعمال',
      minutes: 'محضر الاجتماع'
    },
    proxy: {
      title: 'تعيين الوكيل',
      assignProxy: 'تعيين وكيل',
      proxyType: 'نوع الوكالة',
      discretionary: 'تقديري',
      instructional: 'بتعليمات',
      selectProxy: 'اختر الوكيل',
      duration: 'المدة',
      instructions: 'تعليمات التصويت'
    },
    admin: {
      dashboard: 'لوحة التحكم',
      users: 'إدارة المستخدمين',
      candidates: 'إدارة المرشحين',
      resolutions: 'إدارة القرارات',
      audit: 'سجلات التدقيق',
      reports: 'التقارير',
      export: 'تصدير البيانات'
    },
    messages: {
      welcome: 'مرحبًا بك في WeVote',
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      loginFailed: 'فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد.',
      checkInSuccess: 'تم تسجيل الحضور بنجاح!',
      quorumReached: 'تم الوصول للنصاب القانوني',
      votingStarted: 'بدأ التصويت',
      votingEnded: 'انتهى التصويت',
      sessionExpired: 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.'
    }
  },

  // Simplified translations for remaining South African languages
  // siSwati, Xitsonga, Tshivenda, isiNdebele, Sepedi
  ss: { common: { login: 'Ngena', logout: 'Phuma', register: 'Bhalisa', submit: 'Thumela', cancel: 'Khansela', save: 'Gcina', delete: 'Susa', edit: 'Hlela', search: 'Funa', loading: 'Kuyalayisha...', error: 'Liphutsa', success: 'Kuyaphumelela', confirm: 'Cinisekisa', yes: 'Yebo', no: 'Cha', back: 'Emuva', next: 'Kokulandelako', finish: 'Ceda', home: 'Ekhaya', profile: 'Liphrofayela', settings: 'Tinhlamulo', help: 'Lusito' }, nav: { home: 'Ekhaya', voting: 'Kuvota', meetings: 'Tihlangano', proxy: 'Kwehlukana Kwemeli', admin: 'I-Dashboard Yebulungisa', auditor: 'Lisango Lencubeko', checkIn: 'Ngena' }, voting: { title: 'I-Dashboard Yekuvota', candidates: 'Kuvotela Batfungelwa', resolutions: 'Kuvotela Tinchubomgomo', castVote: 'Vota', voteFor: 'Vota Nge', voteAgainst: 'Vota Ngekuphikisana', abstain: 'Zibambe', voteSubmitted: 'Livoti lakho litfunyetwe ngemphumelelo', voteVerification: 'Kucinisekiswa Kwelivoti', verifyCode: 'Faka likhodi lekucinisekisa' }, meetings: { title: 'Kulawula Tihlangano', upcoming: 'Tihlangano Letitako', past: 'Tihlangano Letedlule', create: 'Kha Umhlangano', join: 'Joyina Umhlangano', checkIn: 'Ngena', quorumMet: 'I-Quorum Ifinyelelwe', quorumNotMet: 'I-Quorum Ayifinyelelwanga', attendees: 'Labakhona', agenda: 'Luhlu Lwemisebenti', minutes: 'Emaminithi' }, proxy: { title: 'Kwehlukana Kwemeli', assignProxy: 'Niketa Umeli', proxyType: 'Luhlobo Lwemeli', discretionary: 'Ngekutsandza', instructional: 'Ngemiyaleto', selectProxy: 'Khetha Umeli', duration: 'Sikhatsi', instructions: 'Tincudziso Tekuvota' }, admin: { dashboard: 'I-Dashboard Yebulungisa', users: 'Kulawula Labasebentisi', candidates: 'Kulawula Batfungelwa', resolutions: 'Kulawula Tinchubomgomo', audit: 'Ema-log Ekuhlola', reports: 'Timbiko', export: 'Kutjhugulula Imininingwane' }, messages: { welcome: 'Wemukelekile ku-WeVote', loginSuccess: 'Kungena kwaphumelela', loginFailed: 'Kungena kuhlulekile. Sicela uhlole tibonelo takho.', checkInSuccess: 'Kungena kwaphumelela!', quorumReached: 'I-quorum ifinyelelwe', votingStarted: 'Kuvota kuqalile', votingEnded: 'Kuvota kuphelile', sessionExpired: 'Seshini yakho iphelelwe lilanga. Sicela wene futsi.' } },
  
  ts: { common: { login: 'Nghena', logout: 'Huma', register: 'Tsarisa', submit: 'Rhumela', cancel: 'Herisa', save: 'Hlayisa', delete: 'Susa', edit: 'Lulamisa', search: 'Lavisisa', loading: 'Yi lava...', error: 'Xihoxo', success: 'Ku humelela', confirm: 'Tiyisisa', yes: 'Ina', no: 'Ee-ee', back: 'Endzhaku', next: 'Landzelaka', finish: 'Hetisa', home: 'Kaya', profile: 'Xifaniso', settings: 'Minhlengeletano', help: 'Mpfuna' }, nav: { home: 'Kaya', voting: 'Ku vota', meetings: 'Minhlangano', proxy: 'Ku nyika Mumeli', admin: 'Dashboard ya Vulawuri', auditor: 'Portal ya Muhlahluvi', checkIn: 'Nghena' }, voting: { title: 'Dashboard ya Vhoti', candidates: 'Ku votela Vatshamberi', resolutions: 'Ku votela Swiboho', castVote: 'Vota', voteFor: 'Votela', voteAgainst: 'Vota u palelana ni', abstain: 'Tihlamarisa', voteSubmitted: 'Vhoti ra wena ri rhumeleriwe hi ku humelela', voteVerification: 'Ku tiyisisa Vhoti', verifyCode: 'Nghenisa khodi ya ku tiyisisa' }, meetings: { title: 'Vulawuri bya Minhlangano', upcoming: 'Minhlangano leyi taka', past: 'Minhlangano leyi hundzeke', create: 'Tumbuluxa Nhlangano', join: 'Nghena eka Nhlangano', checkIn: 'Nghena', quorumMet: 'Quorum yi fikeriwe', quorumNotMet: 'Quorum a yi fikerwanga', attendees: 'Lava nga kona', agenda: 'Nkongomelo', minutes: 'Timinete' }, proxy: { title: 'Ku nyika Mumeli', assignProxy: 'Nyika Mumeli', proxyType: 'Muxaka wa Mumeli', discretionary: 'Hi ku ehleketa', instructional: 'Hi swiletelo', selectProxy: 'Hlawula Mumeli', duration: 'Nkarhi', instructions: 'Swiletelo swa ku vota' }, admin: { dashboard: 'Dashboard ya Vulawuri', users: 'Vulawuri bya Vatirhisi', candidates: 'Vulawuri bya Vatshamberi', resolutions: 'Vulawuri bya Swiboho', audit: 'Ti-log ta Nhlayo', reports: 'Swiviko', export: 'Humesa Data' }, messages: { welcome: 'Ku amukeriwile eka WeVote', loginSuccess: 'Ku nghena ku humelele', loginFailed: 'Ku nghena a ku humelela. Kumbexe u kambela swiphuneko swa wena.', checkInSuccess: 'Ku nghena ku humelele!', quorumReached: 'Quorum yi fikeriwe', votingStarted: 'Ku vota ku sungurile', votingEnded: 'Ku vota ku hetile', sessionExpired: 'Sesexini ya wena yi herile. Kumbexe u nghene nakambe.' } },
  
  ve: { common: { login: 'Khou ṱanganya', logout: 'Khou bva', register: 'U ṅwaliswa', submit: 'U rumela', cancel: 'U khansela', save: 'U dzhenisa', delete: 'U vhusisa', edit: 'U khwinisa', search: 'U ṱoḓa', loading: 'Zwi khou ṱoḓiswa...', error: 'Phosho', success: 'Vhudi', confirm: 'U khwinisedza', yes: 'Ndi', no: 'Hai', back: 'Tshilalo', next: 'U tevhelaho', finish: 'U fhedza', home: 'Hayani', profile: 'Mbonalo', settings: 'Nzudzanyo', help: 'Thuso' }, nav: { home: 'Hayani', voting: 'U vhoṱa', meetings: 'Mbekanyamushumo', proxy: 'U ṅwala muimeleli', admin: 'Dashboard ya Mulauli', auditor: 'Portal ya Muoditi', checkIn: 'Khou ṱanganya' }, voting: { title: 'Dashboard ya Vhoṱha', candidates: 'U vhoṱela Vhagwevhi', resolutions: 'U vhoṱela Mbekanyamaitele', castVote: 'Vhoṱa', voteFor: 'Vhoṱa uri', voteAgainst: 'Vhoṱa u tshi hanana na', abstain: 'Dzumbama', voteSubmitted: 'Vhoṱha yaṋu yo rumelwa nga ndila yo teaho', voteVerification: 'U khwinisedza Vhoṱha', verifyCode: 'Ṱanganyani khodo ya u khwinisedza' }, meetings: { title: 'U luga Mbekanyamushumo', upcoming: 'Mbekanyamushumo i ḓaho', past: 'Mbekanyamushumo yo fhelaho', create: 'Itani Mushumo', join: 'Ṱanganyani kha Mushumo', checkIn: 'Khou ṱanganya', quorumMet: 'Quorum yo swikeledzwa', quorumNotMet: 'Quorum a yo swikeledzwi', attendees: 'Vho dzhielaho', agenda: 'Agenda', minutes: 'Minithi' }, proxy: { title: 'U ṅwala Muimeleli', assignProxy: 'Ṅwalani Muimeleli', proxyType: 'Tshaka ḽa Muimeleli', discretionary: 'Nga u funesa', instructional: 'Nga milayo', selectProxy: 'Nangani Muimeleli', duration: 'Ṱhoho', instructions: 'Milayo ya u vhoṱa' }, admin: { dashboard: 'Dashboard ya Mulauli', users: 'U luga Vhashumisi', candidates: 'U luga Vhagwevhi', resolutions: 'U luga Mbekanyamaitele', audit: 'Loga dza Oditi', reports: 'Mivhigo', export: 'Ṱhogelani Data' }, messages: { welcome: 'Ni amukelwa kha WeVote', loginSuccess: 'U ṱanganya ho teaho', loginFailed: 'U ṱanganya a ho tea. Vhonani khwiniso dzaṋu.', checkInSuccess: 'U ṱanganya ho teaho!', quorumReached: 'Quorum yo swikeledzwa', votingStarted: 'U vhoṱa vho thoma', votingEnded: 'U vhoṱa vho fhela', sessionExpired: 'Tshifhinga tshaṋu tsho fhela. Ṱanganyani hafhu.' } },
  
  nr: { common: { login: 'Ngena', logout: 'Phuma', register: 'Bhalisa', submit: 'Thumela', cancel: 'Khansela', save: 'Londoloza', delete: 'Cima', edit: 'Lungisa', search: 'Funa', loading: 'Kuyalayisha...', error: 'Iphutha', success: 'Impumelelo', confirm: 'Qinisekisa', yes: 'Yebo', no: 'Hayi', back: 'Buyela emuva', next: 'Okulandelako', finish: 'Qeda', home: 'Ikhaya', profile: 'Iphrofayili', settings: 'Izilungiselelo', help: 'Usizo' }, nav: { home: 'Ikhaya', voting: 'Ukuvota', meetings: 'Imihlangano', proxy: 'Ukwabela Ummeleli', admin: 'I-Dashboard Yomlawuli', auditor: 'Isango Lomhloli', checkIn: 'Ngena' }, voting: { title: 'I-Dashboard Yokuvota', candidates: 'Ukuvotela Abagwetjhi', resolutions: 'Ukuvotela Izinqumo', castVote: 'Vota', voteFor: 'Votela', voteAgainst: 'Vota Ngokuphikisana', abstain: 'Zibambe', voteSubmitted: 'Ivoti lakho lithunyelelwe ngempumelelo', voteVerification: 'Ukuqinisekiswa Kwevoti', verifyCode: 'Faka ikhodi yokuqinisekisa' }, meetings: { title: 'Ukulawula Imihlangano', upcoming: 'Imihlangano Ezayo', past: 'Imihlangano Edluleko', create: 'Yenza Umhlangano', join: 'Ngena Emhlanganweni', checkIn: 'Ngena', quorumMet: 'I-Quorum Ifinyelelwe', quorumNotMet: 'I-Quorum Kayifinyelelwanga', attendees: 'Abakhonapho', agenda: 'I-Agenda', minutes: 'Iminithisi' }, proxy: { title: 'Ukwabela Ummeleli', assignProxy: 'Nikeza Ummeleli', proxyType: 'Uhlobo Lommeleli', discretionary: 'Ngokukhethako', instructional: 'Ngeziyalezo', selectProxy: 'Khetha Ummeleli', duration: 'Isikhathi', instructions: 'Imiyalelo Yokuvota' }, admin: { dashboard: 'I-Dashboard Yomlawuli', users: 'Ukulawula Abasebenzisi', candidates: 'Ukulawula Abagwetjhi', resolutions: 'Ukulawula Izinqumo', audit: 'Amalogi Wokuhlola', reports: 'Imibiko', export: 'Khipha Idatha' }, messages: { welcome: 'Wamukelekile ku-WeVote', loginSuccess: 'Ukungena kuphumelele', loginFailed: 'Ukungena kuhlulekile. Qinisekisa imibhalo yakho yokungenako.', checkInSuccess: 'Ukungena kuphumelele!', quorumReached: 'I-quorum ifinyelelwe', votingStarted: 'Ukuvota kuqalile', votingEnded: 'Ukuvota kuphelile', sessionExpired: 'Iseshini yakho iphelelwe. Ngena futhi.' } },
  
  ns: { common: { login: 'Tsena', logout: 'Tswa', register: 'Ngwadisa', submit: 'Romela', cancel: 'Khansela', save: 'Boloka', delete: 'Phumula', edit: 'Fetola', search: 'Nyaka', loading: 'E a lesa...', error: 'Phošo', success: 'Katlego', confirm: 'Tiišetša', yes: 'Ee', no: 'Aowa', back: 'Morago', next: 'Latelago', finish: 'Fetša', home: 'Gae', profile: 'Profaele', settings: 'Dipeakanyo', help: 'Thušo' }, nav: { home: 'Gae', voting: 'Go Vouta', meetings: 'Dikopano', proxy: 'Kabo ya Moemedi', admin: 'Letlapa la Taolo', auditor: 'Kgorong ya Mohlahlobi', checkIn: 'Tsena' }, voting: { title: 'Letlapa la Vouto', candidates: 'Go Voutela Baipei', resolutions: 'Go Voutela Diphetho', castVote: 'Vouta', voteFor: 'Voutela', voteAgainst: 'Vouta o Kgahlanong', abstain: 'Ithibela', voteSubmitted: 'Vouto ya gago e rometswe ka katlego', voteVerification: 'Tlhahlobo ya Vouto', verifyCode: 'Tsenya khoutu ya tlhahlobo' }, meetings: { title: 'Taolo ya Dikopano', upcoming: 'Dikopano tše di Tlago', past: 'Dikopano tše di Fetilego', create: 'Hlola Kopano', join: 'Tsena Kopanong', checkIn: 'Tsena', quorumMet: 'Palo e Fihletswe', quorumNotMet: 'Palo Ga e a Fihlega', attendees: 'Ba ba Teng', agenda: 'Lenano', minutes: 'Metsotso' }, proxy: { title: 'Kabo ya Moemedi', assignProxy: 'Abela Moemedi', proxyType: 'Mohuta wa Moemedi', discretionary: 'Ka Boikgethelo', instructional: 'Ka Ditaelo', selectProxy: 'Kgetha Moemedi', duration: 'Nako', instructions: 'Ditaelo tša Vouto' }, admin: { dashboard: 'Letlapa la Taolo', users: 'Taolo ya Badiriši', candidates: 'Taolo ya Baipei', resolutions: 'Taolo ya Diphetho', audit: 'Di-log tša Tlhahlobo', reports: 'Dipego', export: 'Ntšha Tshedimošetšo' }, messages: { welcome: 'O amogelwa go WeVote', loginSuccess: 'Tseno e atlehile', loginFailed: 'Tseno e hlolehile. Hlahloba bosupi bja gago.', checkInSuccess: 'Go tsena go atlehile!', quorumReached: 'Palo e fihletswe', votingStarted: 'Vouto e thomile', votingEnded: 'Vouto e fedile', sessionExpired: 'Sešene ya gago e fedile. Tsena gape.' } }
};

class LanguageService {
  private currentLanguage: Language = 'en';
  private readonly STORAGE_KEY = 'preferredLanguage';

  constructor() {
    // Load saved language preference
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved && this.isValidLanguage(saved)) {
      this.currentLanguage = saved as Language;
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  /**
   * Set language
   */
  setLanguage(lang: Language): void {
    if (!this.isValidLanguage(lang)) {
      console.error(`Invalid language: ${lang}`);
      return;
    }
    this.currentLanguage = lang;
    localStorage.setItem(this.STORAGE_KEY, lang);
    window.dispatchEvent(new Event('languageChange'));
  }

  /**
   * Check if language code is valid
   */
  private isValidLanguage(lang: string): boolean {
    return ['en', 'es', 'fr', 'de', 'zh', 'af', 'zu', 'xh', 'st', 'tn', 'ss', 'ts', 've', 'nr', 'ns', 'hi', 'ta', 'ar'].includes(lang);
  }

  /**
   * Get translation for a key
   */
  t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation not found for key: ${key}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Array<{ code: Language; name: string; flag: string; category?: string }> {
    return [
      // International Languages
      { code: 'en', name: 'English', flag: '🇺🇸', category: 'International' },
      { code: 'es', name: 'Español', flag: '🇪🇸', category: 'International' },
      { code: 'fr', name: 'Français', flag: '🇫🇷', category: 'International' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪', category: 'International' },
      { code: 'zh', name: '中文', flag: '🇨🇳', category: 'International' },
      
      // South African Official Languages
      { code: 'af', name: 'Afrikaans', flag: '🇿🇦', category: 'South African' },
      { code: 'zu', name: 'isiZulu', flag: '🇿🇦', category: 'South African' },
      { code: 'xh', name: 'isiXhosa', flag: '🇿🇦', category: 'South African' },
      { code: 'st', name: 'Sesotho', flag: '🇿🇦', category: 'South African' },
      { code: 'tn', name: 'Setswana', flag: '🇿🇦', category: 'South African' },
      { code: 'ss', name: 'siSwati', flag: '�🇦', category: 'South African' },
      { code: 'ts', name: 'Xitsonga', flag: '🇿🇦', category: 'South African' },
      { code: 've', name: 'Tshivenda', flag: '🇿🇦', category: 'South African' },
      { code: 'nr', name: 'isiNdebele', flag: '🇿🇦', category: 'South African' },
      { code: 'ns', name: 'Sepedi', flag: '🇿🇦', category: 'South African' },
      
      // Additional Languages
      { code: 'hi', name: 'हिंदी (Hindi)', flag: '🇮🇳', category: 'Asian' },
      { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮�🇳', category: 'Asian' },
      { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦', category: 'Middle Eastern' }
    ];
  }

  /**
   * Get translation object for current language
   */
  getTranslations(): Translation {
    return translations[this.currentLanguage];
  }
}

export const languageService = new LanguageService();
