import { Markup } from 'telegraf';
import { promo_codes } from '@prisma/client';
import { HiddifyMobileHandler } from '../handlers/VPN/downloadApps/handleHiddifyMobile';

//Главная страница
export const StartTexts = {
  startWithSub: (subscriptionEnd: string, daysLeft: number) => `
🗓 Ваша подписка действительна до ${subscriptionEnd}.

Оставшееся кол-во дней подписки: ${daysLeft} дней.

🔄 Для продления подписки нажмите кнопку "Продлить подписку"

🎫 Нажмите кнопку "Ввести промокод", тут вы можете активировать промокод и посмотреть информацию о добавленных.

🎁 В разделе "Пригласить друга" вы найдете реферальный код, за каждого друга вы получаете месяц подписки на сервис.

❓ Если у вас есть вопросы, просто нажмите "Помощь" — возможно, мы уже ответили на них.
`,

  startWithoutSub: `
Мы предлагаем надежный и быстрый VPN без ограничений по трафику, скорости и количеству подключенных устройств!

📝 Нажмите кнопку "Подписка", чтобы оформить новую или узнать информацию о текущей подписке и получить ключ подключения к VPN.

🎫 Нажмите кнопку "Ввести промокод", тут вы можете активировать промокод и посмотреть информацию о добавленных.

🎁 В разделе "Пригласить друга" вы найдете реферальный код, за каждого друга вы получаете месяц подписки на сервис.

❓ Если у вас есть вопросы, просто нажмите "Помощь" — возможно, мы уже ответили на них.
`,
};
export const StartKeyboards = {
  withSubscription: Markup.inlineKeyboard([
    [Markup.button.callback('🌍 Доступ к VPN', 'vpn_menu')],
    [Markup.button.callback('🔄 Продлить подписку', 'extend_subscription')],
    [Markup.button.callback('🎫 Ввести промокод', 'promotion')],
    [Markup.button.callback('🎁 Пригласить друга', 'referral')],
    [Markup.button.callback('❓ Помощь', 'help')],
  ]),

  withoutSubscription: Markup.inlineKeyboard([
    [Markup.button.callback('📝 Подписка', 'subscribe')],
    [Markup.button.callback('🎫 Промокоды', 'promotion')],
    [Markup.button.callback('🎁 Пригласить друга', 'referral')],
    [Markup.button.callback('❓ Помощь', 'help')],
  ]),
};

//Страница HELP

export const HelpText = `
Этот бот предназначен для удобного управления вашими VPN-подписками.

📝 Для оформления подписки воспользуйтесь инструкцией по кнопке "Инструкция"

Дополнительные возможности:

🔄 Продление подписки: Для этого перейдите в раздел "Подписка" и выберите "Продлить подписку", затем выберите срок продления.

🌍 Смена региона VPN: Вы можете без ограничений менять регион, перейдя в раздел "Подписка" и выбрав "Выбрать регион". Регионом по умолчанию является Нидерланды.

🔑 Получение ключа существующей подписки: Если вам нужен ключ для уже активной подписки, перейдите в раздел "Подписки" и выберите "Получить ключ".

🎁 Бонусы для вас и ваших друзей: Поделитесь своим реферальным кодом, перейдя в раздел "Реферальная система", и получите дополнительные преимущества.

💬 Если у вас возникли вопросы, пожалуйста, нажмите кнопку "FAQ" для получения ответов.

🤖 По всем остальным вопросам можете написать в нашу поддержку: @Slivki_VPN_support
    `;

export const HelpKeyboard = Markup.inlineKeyboard([
  [Markup.button.url('💬 FAQ', 'https://telegra.ph/CHasto-zadavaemye-voprosy-09-24-4')], // Изменили на button.url
  [Markup.button.url('📄 Инструкция', 'https://telegra.ph/Instrukciya-po-oformleniyu-podpiski-09-24')],
  [
    Markup.button.url(
      '📺 Инструкция Смарт ТВ',
      'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24',
    ),
  ],
  [Markup.button.callback('📱 Скачать Outline', 'download_outline')],
  [Markup.button.callback('📱 Скачать Hiddify', 'download_hiddify')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);

//Страница с кнопками доступа к ВПН
export const VpnMenuText = `
    Для подключения к VPN мы используем 2 протокола, подробнее об этом вы можете прочитать кликнув по кнопке "Информация"
    
    Для выбора протокола нажмите кнопку "Изменить протокол VPN"
    
    🔑  Для получения доступа к VPN нажмите 'Получить ключ'.
    
    📺  Для настройки Смарт-ТВ нажмите 'Ключ для Смарт ТВ'
`;
export const VpnMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🔑 Получить ключ', 'get_key')],
  [Markup.button.callback('📺 Ключ для Смарт ТВ', 'smart_tv_key')],
  [Markup.button.callback('🔄 Изменить протокол VPN', 'protocol_list')],
  [Markup.button.callback('❓ Информация', 'smart_tv_key')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);

//Страница выбора протокола

export const protocolList = {
  test(protocolName: string) {
    return `Ваш активный протокол - ${protocolName}
    Вы можете выбрать другой протокол кликнув по кнопке
    `;
  },
};

//Страница получения ключа и выбора региона

export const GetVpnKey = {
  text(regionName: string, regionFlag: string, key: string) {
    return `
Ваш активный ключ
Регион - ${regionName} ${regionFlag}

<code><a href="tg://copy?text=${key}">${key}</a></code>

Чтобы использовать его, откройте приложение Outline и нажмите на плюсик в верхнем правом углу.

Для копирования ключа просто нажмите на него в сообщении.`;
  },
  buttonsOutline() {
    return [
      [Markup.button.callback('📱 Скачать Outline', 'download_outline')],
      [Markup.button.callback('⬅️ Назад', 'vpn_menu')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ];
  },
  buttonsHiddify() {
    return [
      [Markup.button.callback('📱 Скачать Hiddify', 'download_hiddify')],
      [Markup.button.callback('⬅️ Назад', 'vpn_menu')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ];
  },
};

// скачивание Outline

export const textDownloadOutline = 'Выберите вашу платформу для скачивания Outline:';
export const keyboardDownloadOutline = Markup.inlineKeyboard([
  [Markup.button.callback('🖥 PC (Mac/Windows/Linux)', 'outline_PC')],
  [Markup.button.callback('📱 Android/iOS', 'outline_Mobile')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);
// скачивание Hiddify
export const textDownloadHiddify = 'Выберите вашу платформу для скачивания Outline:';
export const keyboardDownloadHiddify = Markup.inlineKeyboard([
  [Markup.button.callback('🖥 PC (Mac/Windows/Linux)', 'hiddify_PC')],
  [Markup.button.callback('📱 Android/iOS', 'mobile_hiddify')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);

//Outline для смартфонов
export const textMobileOutline = 'Выберите версию для скачивания:';

export const keyboardMobileOutline = Markup.inlineKeyboard([
  [Markup.button.url('🤖 Android', 'https://play.google.com/store/apps/details?id=org.outline.android.client')],
  [Markup.button.url('🍎 iOS', 'https://itunes.apple.com/app/outline-app/id1356177741')],
  [Markup.button.callback('⬅️ Назад к выбору платформы', 'download_outline')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);

//Hiddify для смартфонов
export const textMobileHiddify = 'Выберите версию для скачивания:';
export const keyboardMobileHiddify = Markup.inlineKeyboard([
  [Markup.button.url('🤖 Android', 'https://play.google.com/store/apps/details?id=app.hiddify.com&pli=1')],
  [Markup.button.url('🍎 iOS', 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532?platform=iphone')],
  [Markup.button.callback('⬅️ Назад к выбору платформы', 'download_hiddify')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);

//Outline на ПК
export const textPcOutline = 'Выберите версию для скачивания:';

export const keyboardPcOutline = Markup.inlineKeyboard([
  [Markup.button.url('🍎 Mac', 'https://itunes.apple.com/app/outline-app/id1356178125')],
  [
    Markup.button.url(
      '🪟 Windows',
      'https://s3.amazonaws.com/outline-releases/client/windows/stable/Outline-Client.exe',
    ),
  ],
  [
    Markup.button.url(
      '🐧 Linux',
      'https://s3.amazonaws.com/outline-releases/client/linux/stable/Outline-Client.AppImage',
    ),
  ],
  [Markup.button.callback('⬅️ Назад к выбору платформы', 'download_outline')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);

// Hiddify для ПК
export const textPcHiddify = `
Выберите версию для скачивания:
Для для установки приложения на mac на чипе intel потребуются дополнительные действия, ознакомьтесь с инструкцией
`;

export const keyboardPcHiddify = Markup.inlineKeyboard([
  [Markup.button.url('🍎 Mac M', 'https://apps.apple.com/us/app/hiddify-proxy-vpn/id6596777532?platform=iphone')],
  [Markup.button.url('🍎 Mac Intel', 'https://github.com/hiddify/hiddify-app/releases/latest/download/Hiddify-MacOS.dmg')],
  [
    Markup.button.url(
      '🪟 Windows',
      'https://github.com/hiddify/hiddify-app/releases/latest/download/Hiddify-Windows-Setup-x64.Msix',
    ),
  ],
  [
    Markup.button.url(
      '🐧 Linux',
      'https://github.com/hiddify/hiddify-app/releases/latest/download/Hiddify-Linux-x64.AppImage',
    ),
  ],
  [Markup.button.callback('❓Инструкция для мак на Intel', 'help')],
  [Markup.button.callback('⬅️ Назад к выбору платформы', 'download_hiddify')],
  [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
]);

// Ключ для SMART TV

export const VpnForSmartTv = {
  noRegionText() {
    return 'Не установлен регион для выдачи ключа, выберете регион';
  },
  noRegionKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback(' Выбрать регион', 'select_region')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
  },
  noVpnKeyText() {
    return (
      'Ключ не найден, он доступен только после оформления подписки, ' +
      'если у вас есть подписка а ключ не отображается обратитесь в службу поддержки'
    );
  },
  noVpnKeyKeyboard() {
    return Markup.inlineKeyboard([[Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')]]);
  },
  endText(region_name: string, flag: string) {
    return `
Ваш регион VPN для Smart Tv - ${region_name} ${flag}

В архиве находится файл конфигурации и apk файлы, их необходимо распаковать на флешку

Воспользуйтесь подробной инструкцией и используйте свой телевизор по максимуму!
  `;
  },
  endKeyboards() {
    return Markup.inlineKeyboard([
      [Markup.button.url('📺 Инструкция', 'https://telegra.ph/Instrukciya-po-ustanovke-Slivki-VPN-na-Smart-TV-09-24')],
      [Markup.button.callback('⬅️ Назад', 'smart_tv_key')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
  },
};

// Выбор региона для Smart TV
export const smartTvRegionText = '🌍Выберите регион для подключения:';
// кнопки там выносить смысла нет, просто регионы и "назад" если иконки назад решишь заменить, сделай тут пометку

//Страница подписки

export const Subscription = {
  activeSubMenuText(subscriptionEnd: string, days_left: number) {
    return `
🗓 Ваша подписка действительна до ${subscriptionEnd}.

Оставшееся кол-во дней подписки: ${days_left} дней.

🔙 Также вы можете вернуться в главное меню.
      `;
  },
  activeSubMenuKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🔄 Продлить подписку', 'extend_subscription')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
  },
  noSubMenuText() {
    return `
У вас пока нет активной подписки. Оформите подписку, чтобы получить доступ к ключу.

Если с вами поделились реферальным кодом, укажите его для получения скидки,
перейдя в раздел 'Указать реферальный код'
      `;
  },
  noSubMenuKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('📝 Оформить подписку', 'extend_subscription')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
  },
};

// Страница продления подписки

export const ExtendSubscription = {
  promoCodeButton() {
    return [Markup.button.callback('✍🏻 🔃 Применить другой промокод', 'promo-code_list')];
  },
  subscriptionStatusTExt(isSub: boolean) {
    return isSub ? 'Выберите срок продления подписки:' : 'Выберите срок подписки:';
    // ? : - тернарный оператор, если isSub true берется первая часть, если нет то после :
  },
  purchaseText(type: string, discount: number, code: string) {
    return `К покупке ${type === 'yearly' ? 'годового тарифа' : ''} будет применена скидка ${discount}% по промокоду ${code}
      Вы можете ${type === 'yearly' ? 'изменить промокод' : 'выбрать другой промокод'} ${type === 'yearly' ? 'если вы хотите купить другой период подписки со скидкой' : ''}
      ${this.subscriptionStatusTExt}`;
    // тут короче если применен промокод годовой выводится: К покупке годового тарифа удет применена скидка .. по промокоду ..
    // Вы можете изменить промокод если вы хотите купить другой период подписки со скидкой,
    // а если промокод обычный: К покупке будет применена скидка .. % по промокоду ..
    //Вы можете выбрать другой промокод
    // а ниже уже выводится продление или покупка, текст выше
  },
  purchaseNoPromoText() {
    return `У вас есть промокоды которые можно применить к покупке. Нажмите 'применить другой промокод'
      
         ${this.subscriptionStatusTExt}`;
  },
};

//Страница подтверждения покупки

export const Payment = {
  paymentText(planName: string, amount: number) {
    return `Вы выбрали продление подписки на ${planName} за ${amount}₽. 
    
      Нажмите кнопку оплатить, чтобы приступить к оплате.`;
  }, //тут наверно стоит так же добавить 'если новая подписка' - вы купили подписку на ....
  paymentKeyboard(redirectUrl: string) {
    return Markup.inlineKeyboard([
      [Markup.button.url('Оплатить', redirectUrl)],
      [Markup.button.callback('⬅️ Назад', 'subscribe')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
  },
};

// Страница после успешной покупки
export const successfulPayment = {
  text(isSub: boolean, days: number) {
    return `    
    Вы ${isSub ? 'продлили' : 'приобрели'} подписку на ${days} дня(ей)
    ${
      !isSub
        ? 'Для подключения нажмите 🌍"Доступ к VPN", в случае трудностей посмотрите раздел ❓"Помощь" или обратитесь в чат поддержки, мы с радостью поможем. Спасибо за то что выбрали нас'
        : 'Спасибо что проболтаете пользоваться нашими услугами'
    }`;
  }, // клавиатура тут такая же как на главной странице с подпиской
};

// Страница промокодов

export const PromoCodes = {
  text(userPromoCodesNotActive: promo_codes[]) {
    return ` 
Добавленные промокоды которые вы можете применить при оплате:
${userPromoCodesNotActive
  .map(
    (code) =>
      `- ${code.code} дает скидку - ${code.discount}%, нужно активировать в течении ${this.botUtils.daysUntilEnd(code.created_at, code.period)} дня(ей)`,
  )
  .join('\n')}
      `; // тут из массива ключей получаем строки с промиком, его скидкой и днями до сгорания, в сообщении это смотрелось очень массивно, надо лаконичнее
  },
  keyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🆕 Добавить новый промокод', 'enter_promo_code')],
      [Markup.button.callback('📝 Подписка', 'subscribe')],
      [Markup.button.callback('⏪ Назад в главное меню', 'back_to_menu')],
    ]);
  },
};

//Страница изменения активного промокода
export const noCodeText = 'У вас нет промокодов доступных для активации';
export const pickCodeText = 'Выберете код который будет применен при следующей оплате';
//клавиатура просто с кнопками назад, и с промкодами которые можно выбрать если они есть, сюда смысла нет перетаскивать тк там больше кода чем текста
// формат такой - join7dfsdf скидка 50% (тут надо придумать как покороче написать о том что его надо применить в течении стольки то дней)

export const Referral = {
  text(code: string, referral_count: number) {
    return `

💸 За каждого друга, который оформит подписку на месяц или более, вы получаете 
один дополнительный месяц, а ваш друг разовую 
скидку 50% на любую подписку.

Ваш реферальный код: 
<code><a href="tg://copy?text=${code}">${code}</a></code>

Для копирования реферального кода просто нажмите на него в сообщении.

Количество приглашенных друзей: ${referral_count}
    `;
  },
};
