-- Två nya områden i admin får egna roller: butiken och tomtförsäljningen.
-- Rollerna används av har_roll() i RLS och av den rollstyrda admin-menyn.
-- Varje add value är en egen sats; ett nytt enum-värde får inte användas
-- i samma transaktion som det läggs till.

alter type roll add value if not exists 'butik';

alter type roll add value if not exists 'tomter';
