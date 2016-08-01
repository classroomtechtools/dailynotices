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

This section requires a bit of attention to detail. It is highly recommended to complete these tasks in a quiet, distraction-free environment.

### Copy the items

- Make a copy of [this Google Form](https://docs.google.com/forms/d/1caemGrtTrhUyiSajnLMAijmzNZ_PPFRhGWBoMwfhza0/copy). This is the form that your users will fill out to submit notices.

- Make a copy of [this Google Sheet](https://docs.google.com/spreadsheets/d/1Vl7K57Q4elL5IVIbhPF6vw7TGETSj5GceYdqC_BOGwQ/copy). This is the database that holds all of the data, including settings.

- Join this [Google Group](https://groups.google.com/d/forum/cttdailynotices), which is required as it gives you the necessary permissions to complete the next step.

- Make a copy of [this Google Site](https://sites.google.com/site/cttdailynoticesdemo/) by clicking on the cog -> "Manage Site" -> "General" -> "Copy this site". If you unable to see the cog, this means that you have not successfully joined the group.

### Configure the doc, sheet, and site

* Go to new copy of the Google Form that you made in step one, and make sure you are in editing mode. Then, click on the "Responses" tab and click on "Link form". Then choose "Existing spreadsheet" and then navigate to the new spreadsheet you made in step 2. Select that new spreadsheet.

* Ensure that the form is configured to record the user's username. If this step is not complete it will result in problems down the line.

* Fill out dummy data in the copy of the new form you made, and then submit.

* Go to the same spreadsheet you selected above (the one that you made a copy of in step 2), and find the tab named something like "Form Responses" which will contain your dummy data.

* Copy the two rows of header information that is found in "Daily Notices". Move over to the "Form Responses" tab with your dummy data and insert a row at row 2. There should now be space to paste the header information from the other tab, which you should do. Now ensure that there are two headers rows by going to "View" menu item and choose to "Freeze" two rows.

* Now that you have the header information, we have to copy some of the formulas over. In the "Daily Notices" tab, starting at J3, select from there until R3. Go back to the "Form Responses" tab, and paste those formulas starting at the J3 column. It has to be the third row, and it has to be the first row that isn't a frozen row.

* Delete the "Daily Notices" tab and rename the "Form Responses" tab "Daily Notices"

### Configure the sheet

This section changes settings in the spreadsheet. Some of these will depend on your organization, but others will need to be very specific.

* In the new spreadsheet you made with the form connected to it, go to the "Admin" tab. It has a red underline. There you will find a number of values that need to be adjusted, depending on your organization and your network. Each item has a comment on the far right, and this comment is bolded if needs to be changed. Some of the values exist righ there in the admin tab, but others live in separate tabs.

* Ensure that you changed forms.Daily Notices to the value of the ID of the new Google Form that is linked to the spreadsheet. It should be the ID only, which you can see in the URL. It is a sequence of characters, such as "1caemGrtTrhUyiSajnLMAijmzNZ_PPFRhGWBoMwfhza0".

* At this point, decide on what sections your organization would like for the notices. You can change them in the form itself, in the first question entitled "Section", and then determine the order in which it will appear by going to the "Sections" tab and changing the values accordingly. 

* Carefully look at the remaining settings and ensure they are appropriate for your organization.

### Configure Holidays

* Go to the Holidays tab. In columns C & D you can indicate when your organization has long holidays (more than one day) and in column F you can indicate when you have one-day holidays. If applicable, you may also indicate weekend days that your organization works (and which the daily notices should therefore run).

* The values in the grey-shaded Column G are used to determine days to skip.

### Set up the archive

* Go to the "Archive" tab which has a purple underline

* In cell A1, enter the time in which notices are cut off from publication on that day. 

### Set up triggers

* Go to Tools -> "Script Editor" and click on "Resources" -> "Current project's triggers". 

* "Add a new Trigger", and then select the "triggerOnSumbit" function and then "From Spreadsheet" and then "on form submit".

* "Add a new Trigger" and then select the "triggerDailyTrigger" function and then "Time driven" and then "Day timer" and then choose an hour range that coincides with your cut off date.

### Configure the Google Site

* Navigate to the newly created Google site you created, and click on "Search Notices". Click the pencil to edit the page, then click the cog in the Google Gadget that appears. You will have to log in to Awesometable. Change the Google Sheet URL value to the URL of the sheet that you created yourself

* Do the exact same for the "Jump to Date" area of the site.
