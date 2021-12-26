
export interface Trip{
    id: string;
    driver_id: string;
    vehicle_id: string;
    user_id: string;
    applicant: string;
    faculty: string;
    purpose: string;
    departure_time: string;
    arrival_time: string;
    trip_number: number;
    created_on: Date;
    updated_on: Date;
}
