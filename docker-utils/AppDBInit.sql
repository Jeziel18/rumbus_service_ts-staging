-- we don't know how to generate root <with-no-name> (class Root) :(
create table device_provider
(
	id varchar(36) not null
		primary key,
	imei varchar(45) null,
	name varchar(36) not null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null
);

create table driver
(
	id varchar(36) not null
		primary key,
	full_name varchar(60) not null,
	license int not null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null
);

create table roles
(
	id varchar(36) not null
		primary key,
	name varchar(45) null,
	`read` tinyint null,
	`write` tinyint null,
	`update` tinyint null,
	`delete` tinyint null,
	service varchar(45) null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null
);

create table route
(
	id varchar(36) not null
		primary key,
	name varchar(45) null,
	description varchar(256) null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null
);

create table user
(
	id varchar(36) not null
		primary key,
	full_name varchar(55) null,
	email varchar(255) null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null
);

create table user_roles
(
	user_id varchar(36) not null,
	role_id varchar(36) not null,
	primary key (user_id, role_id),
	constraint role_id_fk2
		foreign key (role_id) references roles (id),
	constraint user_id_fk2
		foreign key (user_id) references user (id)
);

create index role_id_fk_idx
	on user_roles (role_id);

create table vehicle
(
	id varchar(36) not null
		primary key,
	property_number int not null,
	plate varchar(11) not null,
	model varchar(45) null,
	brand varchar(45) null,
	capacity int not null,
	handicap_enabled tinyint(1) not null,
	mileage int not null,
	ownership varchar(45) not null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null
);

create table trip
(
	trip_number int auto_increment,
	id varchar(36) not null
		primary key,
	driver_id varchar(36) null,
	vehicle_id varchar(36) null,
	user_id varchar(36) null,
	applicant varchar(55) null,
	faculty varchar(55) null,
	purpose varchar(256) null,
	departure_time datetime default current_timestamp() null,
	arrival_time datetime null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null,
	constraint trip_number
		unique (trip_number),
	constraint driver_id_fk
		foreign key (driver_id) references driver (id),
	constraint user_id_fk
		foreign key (user_id) references user (id),
	constraint vehicle_id_fk
		foreign key (vehicle_id) references vehicle (id)
);

create table canceled_trip
(
    trip_id varchar(36) not null primary key,
	purpose varchar(45) not null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
    created_on timestamp default current_timestamp() not null,
	constraint trip_id_fk4
		foreign key (trip_id) references trip (id)
);

create table administrative_trip
(
	trip_id varchar(36) not null
		primary key,
	type varchar(45) not null,
	destination varchar(45) not null,
	constraint trip_id_fk3
		foreign key (trip_id) references trip (id)
);

create table public_trip
(
	trip_id varchar(36) not null
		primary key,
	route_id varchar(36) not null,
	constraint route_id_fk
		foreign key (route_id) references route (id),
	constraint trip_id_fk
		foreign key (trip_id) references trip (id)
);

create index route_id_fk_idx
	on public_trip (route_id);

create index driver_id_fk_idx
	on trip (driver_id);

create index user_id_fk_idx
	on trip (user_id);

create index vehicle_id_fk_idx
	on trip (vehicle_id);

create table trip_device
(
	trip_id varchar(36) not null,
	device_id varchar(36) not null,
	primary key (trip_id, device_id),
	constraint device_id_fk_1
		foreign key (device_id) references device_provider (id),
	constraint trip_id_fk_1
		foreign key (trip_id) references trip (id)
);

create table trip_event
(
	id varchar(36) not null
		primary key,
	trip_id varchar(36) not null,
	description varchar(255) null,
	type varchar(36) null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null,
	constraint trip_id_fk2
		foreign key (trip_id) references trip (id)
);

create index trip_id_fk2_idx
	on trip_event (trip_id);

create table vehicle_usage
(
    trip_id varchar(36) not null primary key,
	end_mileage_system int null,
	start_mileage int null,
	end_mileage int null,
	start_gas int null,
	end_gas int null,
	gas_expense int null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	constraint trip_id_fk_3
		foreign key (trip_id) references trip (id)
);

create table vehicle_maintenance
(
    id varchar(36) not null primary key,
    user_id varchar(36) not null,
    vehicle_id varchar(36) not null,
	mileage int not null,
	type varchar(45) not null,
	cost float(2) not null,
	details text not null,
	inspector varchar(255) not null,
	maintenance_date date not null,
	created_on timestamp default current_timestamp() not null,
	constraint vehicle_id_fk_2 foreign key (vehicle_id) references vehicle (id),
	constraint user_id_fk_2 foreign key (user_id) references user (id)
);

create view vehicle_trip_overview as SELECT vehicle_id, trip_id,
 end_mileage_system - start_mileage as miles_driven_system, end_mileage - start_mileage as miles_driven
FROM trip t inner join vehicle_usage vu on t.id = vu.trip_id;

create table announcement
(
    id varchar(36) not null primary key,
    user_id varchar(36) not null,
    headline varchar(255) not null,
	content text not null,
	expire_at timestamp not null,
    updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null,
	constraint user_id_fk_3 foreign key (user_id) references user (id)
);
