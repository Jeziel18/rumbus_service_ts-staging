create table agency
(
	id varchar(36) not null
		primary key,
	name varchar(60) not null,
	url varchar(256) null,
	timezone varchar(64) null
);

create table calendar
(
	id varchar(36) not null
		primary key,
	monday tinyint(1) not null,
	tuesday tinyint(1) not null,
	wednesday tinyint(1) not null,
	thursday tinyint(1) not null,
	friday tinyint(1) not null,
	saturday tinyint(1) not null,
	sunday tinyint(1) not null,
	start_date date not null,
	end_date date not null
);

create table calendar_dates
(
	service_id varchar(36) not null,
	date date not null,
	exception_type tinyint(1) not null,
	primary key (service_id, date),
	constraint calendar_dates_calendar_id_fk
		foreign key (service_id) references calendar (id)
);

create table device_provider
(
	id varchar(36) not null
		primary key,
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
	name varchar(45) not null,
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
	agency_id varchar(36) not null,
	short_name varchar(45) null,
	long_name varchar(90) not null,
	description varchar(256) null,
	type tinyint not null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null,
	constraint route_agency_id_fk
		foreign key (agency_id) references agency (id)
);

create table shape
(
	id varchar(36) not null
		primary key,
	name varchar(45) not null,
	created_on timestamp default current_timestamp() not null
);

create table shape_point
(
	shape_id varchar(36) not null
		primary key,
	lat decimal(10,8) not null,
	lon decimal(11,8) not null,
	sequence int not null,
	constraint shape_id_fk
    		foreign key (shape_id) references shape (id)
);

create table stop
(
	id varchar(36) not null
		primary key,
	name varchar(45) not null,
	lat decimal(10,8) not null,
	lon decimal(11,8) not null,
	location_type tinyint(1) not null,
	wheelchair_boarding tinyint(1) null
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

create table announcement
(
	id varchar(36) not null
		primary key,
	user_id varchar(36) not null,
	headline varchar(36) not null,
	content text not null,
	expire_at timestamp not null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null,
	constraint announcement_user_id_fk
		foreign key (user_id) references user (id)
);

create table user_roles
(
	user_id varchar(36) not null,
	role_id varchar(36) not null,
	primary key (user_id, role_id),
	constraint user_roles_roles_id_fk
		foreign key (role_id) references roles (id),
	constraint user_roles_user_id_fk
		foreign key (user_id) references user (id)
);

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
	service_id varchar(36) null,
	shape_id varchar(36) null,
	device_provider_id varchar(36) null,
	applicant varchar(55) null,
	faculty varchar(55) null,
	purpose varchar(55) null,
	departure_time datetime default current_timestamp() null,
	arrival_time datetime null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() not null,
	constraint trip_number
		unique (trip_number),
	constraint trip_calendar_id_fk
		foreign key (service_id) references calendar (id),
	constraint trip_driver_id_fk
		foreign key (driver_id) references driver (id),
	constraint trip_shape_id_fk
		foreign key (shape_id) references shape (id),
	constraint trip_user_id_fk
		foreign key (user_id) references user (id),
	constraint trip_vehicle_id_fk
		foreign key (vehicle_id) references vehicle (id),
	constraint device_provider_id_fk
        		foreign key (device_provider_id) references device_provider (id)
);

create table administrative_trip
(
	trip_id varchar(36) not null
		primary key,
	type varchar(45) not null,
	destination varchar(45) not null,
	constraint administrative_trip_trip_id_fk
		foreign key (trip_id) references trip (id)
);

create table canceled_trip
(
	trip_id varchar(36) not null
		primary key,
	purpose varchar(45) not null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
	created_on timestamp default current_timestamp() null,
	constraint canceled_trip_trip_id_fk
		foreign key (trip_id) references trip (id)
);

create table public_trip
(
	trip_id varchar(36) not null
		primary key,
	route_id varchar(36) not null,
	constraint public_trip_route_id_fk
		foreign key (route_id) references route (id),
	constraint public_trip_trip_id_fk
		foreign key (trip_id) references trip (id)
);

create table stop_times
(
	trip_id varchar(36) not null
		primary key,
	stop_id varchar(36) not null,
	arrival_time datetime null,
	departure_time datetime null,
	stop_sequence int not null,
	continuous_pickup tinyint(1) null,
	continuous_drop_off tinyint(1) null,
	timepoint tinyint(1) null,
	constraint stop_times_stop_id_fk
		foreign key (stop_id) references stop (id),
	constraint stop_times_trip_id_fk
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
	constraint trip_event_trip_id_fk
		foreign key (trip_id) references trip (id)
);

create table vehicle_maintenance
(
	id varchar(36) not null
		primary key,
	user_id varchar(36) not null,
	vehicle_id varchar(36) not null,
	mileage int not null,
	type varchar(45) not null,
	cost float(2,0) not null,
	details text not null,
	inspector varchar(255) not null,
	maintenance_date date not null,
	created_on timestamp default current_timestamp() not null,
	constraint vehicle_maintenance_user_id_fk
		foreign key (user_id) references user (id),
	constraint vehicle_maintenance_vehicle_id_fk
		foreign key (vehicle_id) references vehicle (id)
);

create table vehicle_usage
(
	trip_id varchar(36) not null
		primary key,
	end_mileage_system int null,
	start_mileage int null,
	end_mileage int null,
	start_gas int null,
	end_gas int null,
	gas_expense int null,
	updated_on timestamp default current_timestamp() not null on update current_timestamp(),
    constraint vehicle_usage_trip_id_fk
    		foreign key (trip_id) references trip (id)
);

create view vehicle_trip_overview as
	select `t`.`vehicle_id`                                 AS `vehicle_id`,
       `vu`.`trip_id`                                   AS `trip_id`,
       `vu`.`end_mileage_system` - `vu`.`start_mileage` AS `miles_driven_system`,
       `vu`.`end_mileage` - `vu`.`start_mileage`        AS `miles_driven`
from (`trip` `t`
         join `vehicle_usage` `vu` on (`t`.`id` = `vu`.`trip_id`));

