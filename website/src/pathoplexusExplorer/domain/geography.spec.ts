import { expect, test } from 'vitest';

import { defined } from '../defined.fixture.ts';
import {
    admin1AreaOf,
    canonicalCountryOf,
    continentOf,
    countryNamesOf,
    hasAdmin1Names,
    isAdmin1Of,
    parsePlace,
    placedCountryOf,
    placeKey,
    subregionOf,
} from './geography.ts';

/** Fixture of recorded country names, excluding non-location values. */
const RECORDED = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'American Samoa',
    'Angola',
    'Anguilla',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Aruba',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Borneo',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'British Virgin Islands',
    'Brunei',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Cape Verde',
    'Cayman Islands',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Cook Islands',
    'Costa Rica',
    "Cote d'Ivoire",
    'Croatia',
    'Cuba',
    'Curacao',
    'Cyprus',
    'Czech Republic',
    'Czechia',
    'Democratic Republic of the Congo',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'East Timor',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'French Guiana',
    'French Polynesia',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Gibraltar',
    'Greece',
    'Grenada',
    'Guadeloupe',
    'Guam',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Hong Kong',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Korea',
    'Kosovo',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Lithuania',
    'Luxembourg',
    'Macedonia',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Marshall Islands',
    'Martinique',
    'Mauritania',
    'Mauritius',
    'Mayotte',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Mongolia',
    'Montserrat',
    'Morocco',
    'Mozambique',
    'Myanmar',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'Netherlands Antilles',
    'New Caledonia',
    'New Delhi',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'Niue',
    'North Macedonia',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Puerto Rico',
    'Qatar',
    'Republic of the Congo',
    'Reunion',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Barthelemy',
    'Saint Helena',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Martin',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Serbia and Montenegro',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Korea',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Swaziland',
    'Sweden',
    'Switzerland',
    'Syria',
    'Taiwan',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tokelau',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Turks and Caicos Islands',
    'Tuvalu',
    'USA',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Venezuela',
    'Viet Nam',
    'Virgin Islands',
    'Wallis and Futuna',
    'Yemen',
    'Yugoslavia',
    'Zaire',
    'Zambia',
    'Zimbabwe',
];

test('every recorded country belongs to a region', () => {
    expect(RECORDED.filter((country) => subregionOf(country) === undefined)).toEqual([]);
});

test('a country is counted under its current name, and an ocean is not a country', () => {
    expect(placedCountryOf('Zaire')).toBe(canonicalCountryOf('Zaire'));
    expect(placedCountryOf('Pacific Ocean')).toBeUndefined();
    expect(placedCountryOf('not provided')).toBeUndefined();
    expect(placedCountryOf(null)).toBeUndefined();
});

test('places round-trip through their keys', () => {
    for (const key of ['', 'continent:Africa', 'subregion:Western Africa', 'country:Nigeria', 'admin1:Nigeria/Kano']) {
        expect(placeKey(defined(parsePlace(key), `'${key}' as a place`))).toBe(key);
    }
    expect(parsePlace('continent:Atlantis')).toBeUndefined();
});

test('a country sits in its region and continent', () => {
    expect(continentOf('Democratic Republic of the Congo')).toBe('Africa');
    expect(subregionOf('Democratic Republic of the Congo')).toBe('Middle Africa');
});

test('a province is found in whichever part of the recorded value names it', () => {
    expect(admin1AreaOf('USA', 'Illinois, Cook County')).toBe('Illinois');
    expect(admin1AreaOf('USA', 'Sacramento, California')).toBe('California');
    expect(admin1AreaOf('USA', 'Suffolk Co., NY')).toBe('New York');
    expect(admin1AreaOf('USA', 'Texas/Houston')).toBe('Texas');
    expect(admin1AreaOf('USA', 'NewYork')).toBe('New York');
    expect(admin1AreaOf('USA', 'Nebrsaka')).toBe('Nebrsaka');
    expect(admin1AreaOf('Switzerland', 'ZH')).toBe('Zürich');
    expect(admin1AreaOf('Switzerland', 'Basel-Landschaft')).toBe('Basel-Land');
    expect(admin1AreaOf('Venezuela', 'DF/Caracas')).toBe('Distrito Capital');
    expect(admin1AreaOf('Nigeria', 'FCT')).toBe('Federal Capital Territory');
    expect(admin1AreaOf('Ghana', 'Ashanti, Kumasi')).toBe('Ashanti');
});

test('a division is found under the name the country records it by', () => {
    expect(admin1AreaOf('Indonesia', 'Jawa Barat')).toBe('West Java');
    expect(admin1AreaOf('Italy', 'EmiliaRomagna')).toBe('Emilia-Romagna');
    expect(admin1AreaOf('Thailand', 'Kampheang-Phet')).toBe('Kamphaeng Phet');
    expect(admin1AreaOf('South Africa', 'Kwa-Zulu Natal')).toBe('KwaZulu-Natal');
    expect(admin1AreaOf('Pakistan', 'Peshawer')).toBe('Khyber Pakhtunkhwa');
    expect(admin1AreaOf('Kenya', 'Kilifi District')).toBe('Kilifi');
    expect(admin1AreaOf('Germany', 'Bayern')).toBe('Bavaria');
    expect(admin1AreaOf('Democratic Republic of the Congo', 'province Kasai Oriental')).toBe('Kasaï-Oriental');
    expect(admin1AreaOf('Democratic Republic of the Congo', 'Sud-Kivu,Kamituga')).toBe('Sud-Kivu');
    expect(admin1AreaOf('Austria', 'Kärnten')).toBe('Carinthia');
    expect(admin1AreaOf('Mexico', 'CDMX.')).toBe('Mexico City');
    expect(admin1AreaOf('Mexico', 'Amatepec, Estado de Mexico')).toBe('State of Mexico');
    expect(admin1AreaOf('Chile', "Region del Libertador General Bernardo O'Higgins")).toBe("O'Higgins");
    expect(admin1AreaOf('Russia', 'Kalmikia')).toBe('Republic of Kalmykia');
});

test('a division below the one that a map draws is counted under the one it belongs to', () => {
    expect(admin1AreaOf('Italy', 'Ancona')).toBe('Marche');
    expect(admin1AreaOf('Spain', 'Barcelona')).toBe('Catalonia');
    expect(admin1AreaOf('United Kingdom', 'Liverpool')).toBe('England');
    expect(admin1AreaOf('Sierra Leone', 'Port Loko')).toBe('Northern');
    expect(admin1AreaOf('Bangladesh', 'Char Fasson, Bhola')).toBe('Barisal');
    expect(admin1AreaOf('Madagascar', 'Antsirabe I')).toBe('Vakinankaratra');
    expect(admin1AreaOf('Hungary', 'Szeged')).toBe('Csongrád-Csanád');
});

test('a division drawn as the country stood is where its later splits are counted', () => {
    // These fixtures use older map boundaries.
    expect(admin1AreaOf('Uganda', 'Kikuube district')).toBe('Hoima');
    expect(admin1AreaOf('Uganda', 'Rubanda')).toBe('Kabale');
    expect(admin1AreaOf('Nepal', 'Sarlahi')).toBe('Janakpur Zone');
    expect(admin1AreaOf('Nepal', 'Birgunj, Parsa')).toBe('Narayani Zone');
});

test('a capital drawn together with the province around it gathers both names', () => {
    expect(admin1AreaOf('Laos', 'Vientiane Capital, Saythany')).toBe('Vientiane');
    expect(admin1AreaOf('Laos', 'Vientiane Province')).toBe('Vientiane');
    expect(admin1AreaOf('Russia', 'Moscow region')).toBe('Moscow');
});

test('a place inside a division is counted under it, but a division named beside it wins', () => {
    expect(admin1AreaOf('China', 'Guangzhou')).toBe('Guangdong');
    expect(admin1AreaOf('Japan', 'Osaka City')).toBe('Ōsaka');
    expect(admin1AreaOf('Brazil', 'Ribeirao Preto')).toBe('São Paulo');
    expect(admin1AreaOf('Brazil', 'Tocantins state (Palmas)')).toBe('Tocantins');
    expect(admin1AreaOf('Brazil', 'Valenca-RJ')).toBe('Rio de Janeiro');
    expect(admin1AreaOf('USA', 'Kansas City MO')).toBe('Missouri');
    expect(admin1AreaOf('USA', 'Kansas, Dodge City')).toBe('Kansas');
    expect(admin1AreaOf('Germany', 'Wuerzburg')).toBe('Bavaria');
    expect(admin1AreaOf('Colombia', 'Barranquilla')).toBe('Atlántico');
    expect(admin1AreaOf('Paraguay', 'Coronel Oviedo')).toBe('Caaguazú');
    expect(admin1AreaOf('Oman', 'Al Seeb')).toBe('Muscat');
    expect(admin1AreaOf('Saudi Arabia', 'Al-Sharafyia, Jeddah')).toBe('Makkah');
});

test('a value that names no one division is kept as it is written', () => {
    expect(admin1AreaOf('Viet Nam', 'South')).toBe('South');
    expect(admin1AreaOf('Malaysia', 'Klang valley')).toBe('Klang valley');
    expect(admin1AreaOf('China', 'Suzhou')).toBe('Suzhou');
    expect(admin1AreaOf('United Kingdom', 'Great Britain')).toBe('Great Britain');
    expect(admin1AreaOf('France', 'Reunion')).toBe('Reunion');
    expect(admin1AreaOf('Chile', 'Easter Island')).toBe('Easter Island');
    // Balaton can refer to a village or to a lake shared by several counties.
    expect(admin1AreaOf('Hungary', 'Balaton')).toBe('Balaton');
    expect(admin1AreaOf('Myanmar', 'Burma')).toBe('Burma');
    expect(admin1AreaOf('Laos', 'Xaysomboune')).toBe('Xaysomboune');
    expect(admin1AreaOf('Paraguay', 'Bella Vista')).toBe('Bella Vista');
});

test('a postal code beside a town names the state, a county abbreviation does not', () => {
    expect(admin1AreaOf('USA', 'Dallas Co. TX')).toBe('Texas');
    expect(admin1AreaOf('USA', 'Albuquerque NM')).toBe('New Mexico');
    expect(admin1AreaOf('USA', 'Washington Co')).toBe('Washington Co');
});

test('a country keeps every name it is recorded under', () => {
    expect(canonicalCountryOf('Zaire')).toBe('Democratic Republic of the Congo');
    expect(canonicalCountryOf('East Timor')).toBe('Timor-Leste');
    expect(canonicalCountryOf('Viet Nam')).toBe('Viet Nam');
    expect(countryNamesOf('Timor-Leste')).toEqual(['Timor-Leste', 'East Timor']);
    expect(countryNamesOf('East Timor')).toEqual(['Timor-Leste', 'East Timor']);
    expect(countryNamesOf('Serbia').sort()).toEqual(['Serbia', 'Serbia and Montenegro', 'Yugoslavia']);
    expect(countryNamesOf('Nigeria')).toEqual(['Nigeria']);
});

test('a division of a country is told apart from a value kept as it was recorded', () => {
    expect(isAdmin1Of('Brazil', admin1AreaOf('Brazil', 'RJ'))).toBe(true);
    expect(isAdmin1Of('Brazil', admin1AreaOf('Brazil', 'Valença'))).toBe(false);
    expect(isAdmin1Of('USA', admin1AreaOf('USA', 'Dallas Co. TX'))).toBe(true);
    expect(isAdmin1Of('USA', admin1AreaOf('USA', 'Washington Co'))).toBe(false);
    expect(isAdmin1Of('Viet Nam', admin1AreaOf('Viet Nam', 'South'))).toBe(false);
    expect(isAdmin1Of('Chile', admin1AreaOf('Chile', 'Easter Island'))).toBe(false);
    expect(isAdmin1Of('Uganda', admin1AreaOf('Uganda', 'Mulago'))).toBe(true);
    expect(hasAdmin1Names('Ghana')).toBe(false);
    expect(isAdmin1Of('Ghana', 'Ashanti')).toBe(false);
    expect(hasAdmin1Names('Brazil')).toBe(true);
});

test('an address names a place by the name it is counted under', () => {
    expect(parsePlace('country:Zaire')).toEqual({ level: 'country', country: 'Democratic Republic of the Congo' });
    expect(parsePlace('country:New Delhi')).toEqual({ level: 'country', country: 'India' });
    expect(parsePlace('admin1:Brazil/Sao Paulo')).toEqual(parsePlace('admin1:Brazil/São Paulo'));
    expect(parsePlace('admin1:USA/Dallas Co. TX')).toEqual({ level: 'admin1', country: 'USA', admin1: 'Texas' });
    expect(parsePlace('admin1:Brazil/')).toBeUndefined();
    expect(parsePlace('country:')).toBeUndefined();
});
