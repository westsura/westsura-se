-- jaktmedlem.underlag_id saknade on delete-regel. Så länge en medlem pekade på ett
-- fakturaunderlag gick underlaget inte att ta bort: främmandenyckeln stoppade det,
-- och taBortUnderlag i admin läser inte felet, så borttagningen blev tyst utan effekt.
--
-- fakturaunderlag.bokning_id och .forfragan_id har on delete set null. Medlemmens
-- koppling ska följa samma mönster: tas underlaget bort blir medlemmen kvar utan
-- avgiftsunderlag, i stället för att borttagningen blockeras.

alter table jaktmedlem drop constraint jaktmedlem_underlag_id_fkey;
alter table jaktmedlem add constraint jaktmedlem_underlag_id_fkey
  foreign key (underlag_id) references fakturaunderlag(id) on delete set null;
