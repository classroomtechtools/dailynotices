# dailynotices
A GAFE-based solution for publishing daily notices for your organization.

## Description
Every day, at a predetermined time, members of your organization receive an email containing the titles and author for that day's notices. The email, at top, contains a link to a Google Site that allows them to view the entire contents. Items that are new for that day are labeled as "New". Older items that have already appeared on previous days appear below newer items. Items authored by pre-determined accounts, for example principals, appear higher than others.

Individuals enter new notices through a Google Form. They have the ability to choose how which dates the notices begin to be pubished, and the last day to be published. They must enter a title and content. If they wish, they may also add a link to a Google Document, or Google Sheet, which will be embedded on the Google Site on any day it is published. Individuals then submit the form, and a feedback email is received, which informs the user that either their submission was successful, or else there were validation issues. Validation issues occur when the user enters invalid publication dates (a start date for an already passed date, for example). It will also inform you of permission errors.

The Google Site contains pages for each day that the notices have been published. There are tabs at the top that allows the user to go back in time and view previous days' notices. There is also a search tool that allows search by keywords.

## Implementation

Unlike other GAFE-based solutions, this one is not an add-on, nor are there plans to make it one. This is for the following reasons:

* Additional technical research would be required on our part to determine if this particular solution as an add-on is even feasible. I know of no other add-ons, for example, that use Google Sites, Sheets, and Forms in this integrated fashion.

* An add-on would mean that ClassroomTechTools would be *obligated* to answer support queries. While we do our best to offer good support, it's just that this approach just reduces pressure.

* Firm belief in Open Source software as viable solutions, in particular for schools and school districts.

## Directions

* Make a copy of (this Google Form)[https://docs.google.com/forms/d/1caemGrtTrhUyiSajnLMAijmzNZ_PPFRhGWBoMwfhza0/copy]. This is the form that your users will fill out to submit notices.

* Make a copy of (this Google Sheet)[https://docs.google.com/spreadsheets/d/1Vl7K57Q4elL5IVIbhPF6vw7TGETSj5GceYdqC_BOGwQ/copy]. This is the database that holds all of the data, including settings.

* Make a copy of (this Google Site)[]
