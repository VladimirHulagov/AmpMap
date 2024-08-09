Version 1.3.2
--------------
*Status: General availability*

*Released: 12-08-2024*

- In the first approximation, mass operations with tests have been implemented, namely: transfer of tests, assessment (TMS-700, TMS-907)
- The functionality of custom attributes has been improved. Custom attributes can be applied to specific result statuses within a project (TMS-857)
- Implemented adding user settings to URL (TMS-858)
- Added the ability to change passwords for external users (TMS-886)
- Implemented a mechanism for notifying users about events in the system, with the ability to customize notifications (TMS-955)
- Implemented the ability to transfer tests from one Test Plan to another within a project while preserving the results (TMS-907)
- Added the ability to clone a test result (TMS-885)
- Optimized Test-Suites search when creating/editing a Test Plan (TMS-851)
- Transition to Python 3.11 and Django 4.2.13

**Bug fixes**:

- When switching to a child plan, the list of labels and the condition should be reset (TMS-831)
- Ordering does not work in the Test-Suites table (TMS-846)
- [Test Plan] Clicking on Test name redirects to Test-Suites (TMS-847)
- Navigation doesn't work on various conditions (TMS-848)
- "Not the latest version" warning appears on any close of the test-case (TMS-849)
- Cannot access the frontend raised in Docker (TMS-853)
- Error processing the GET parameter parent_id in TestPlanViewSet (treeview) (TMS-854)
- Incorrect pagination when filtering by name (TMS-855)
- When setting the SKIPPED and RETEST status, it requires filling in the fields (TMS-856)
- Soft deleting parameter not allowing to create another one. (TMS-882)
- Incorrect error output for mandatory attributes in test result (TMS-884)
- Backend responds with incorrect set of Steps (TMS-894)
- Pagination inside the test plan doesn't work 
- Number of DB connections exceeded (TMS-942)
- RecursionError when copying a test plan to itself or a test plan to a child test plan (TMS-946)
- Not all suites are displayed in the Suite field search when editing TC (TMS-954)


Version 1.3.1
--------------
*Status: General availability*

*Released: 05-06-2024*

- Added custom attributes and their project based configuration (TMS-666)

  - Valid targets for custom attributes are: Test-Case, Test-Result, Test-Suite

- Test-Case creation is now in separate window (TMS-670)
- Test result edit time is now configurable per project (TMS-742):

  - Test-Result is editable in time gap
  - Test-Result is forever editable
  - Test-Result is not editable

- Added role based access per project (TMS-712)
- Added Test-Plan copying

  - Plan can only be copied to project of its source
  - Test assignee can be copied or dropped

- Test-Suite copying destination suite select is more readable now (TMS-728)
- Test-Copying copying destination suite select is more readable now (TMS-748)
- Contact email added (TMS-766)
- Added filtering tests by labels in Test-Plan creation window (TMS-706)
- Test-Suite filter in Test-Plan table view improved (TMS-731)
- The behavior of the filter by labels on the Test-Plans tab has been changed.
- Now the filter is applied to the table view of tests (TMS-788).

**Bug fixes**:

- Incorrect sorting by result attribute is incorrect (TMS-719) 
- Cannot create a label if there was already a label with the same name (TMS-734)
- Cannot update comment in Test result if test or project changed (TMS-736)
- Incorrect suite path in tests (TMS-741)
- Problem with displaying data with markdown in the Expected field (TMS-759)
- (Activity) Incorrect time for result in Activity table (TMS-762)
- It's possible to edit archived test-result (TMS-763)
- It's possible to add new result to archived test (TMS-764)
- Via API you can create a test result with the status UNTESTED (TMS-772)
- Filtering is not working for suites if there are sub suites in the project (TMS-731)
- Delete preview for testcases/testsuites pickling error (TMS-771)
- Redirecting to 404 after using of search with pagination on TestSuites/Cases (TMS-773)
- Archived test cases are imported to test plan (TMS-774)
- HTTP 404 during search and navigation in Test Suites & Cases (TMS-776)
- When updating the result with steps, an error occurred (TMS-777)
- Unable to load allure report (TMS-778)
- 504 Gateway Time-out when creating testplans in bulk (TMS-782)
- Error when using parent query parameter with search on tree structures (TMS-783)
- Labels on TestPlan view are broken (TMS-785)
- Incorrect behavior of "not the latest version" warning on cancel of Test-Case edit (TMS-786)
- 400 on Test-Plans when filtering by Test-Suites (TMS-796)
- Extra confirmation to close the test (TMS-798) 
- After editing a test, the test version is not displayed correctly (TMS-800)
- External User must not see statistics for projects on the Dashboard (TMS-804)
- no way to enter test results (TMS-815)
- bash lines formatting for already written tests (TMS-816)
- Formatting as code (```) in markddown fields broke in already written tests (TMS-820)
- When saving the result, it requires filling in an NOT mandatory attribute (TMS-826)
- When refreshing the test case editing page, it redirects to information about it (TMS-827)
- It's possible to delete required custom attribute on case/result edit screen (TMS-828)
- Error when Restore version test case (TMS-830)
- When creating a case, we have a disable button (TMS-833) 
- Performance issues with cases search when labels are applied (TMS-834) 
- Page layout breaks after test-case editing (TMS-836) 
- 404 when loading pagination (TMS-839) 

Version 1.2.15
--------------
*Status: General availability*

*Released: 11-04-2024*

- Added estimates to tests (TMS-745)
- Fixed duplicate test case history record that caused 500

Version 1.2.14
--------------
*Status: General availability*

*Released: 15-03-2024*

- Generalized import policy to start all imports from *testy*
- Changed plugin system to use pluggy to simplify plugin development
- Made testy installable for more convenient plugin development
- Remade all existing plugins to work with new plugin system
- Added production configuration based on Nginx

Version 1.2.13
--------------
*Status: General Availability*

*Released: 22-11-2023*

- Added `estimate` column for the suite table (TMS-558)
- Added the system statistics (TMS-420, TMS-591)
- Project server pagination (TMS-364)
- Added filter by assignee field for test list (TMS-423)
- Suites table optimization
- Add the ability to add attachments only for comment

Version 1.2.12
--------------
*Status: Internal*

*Released: 20-11-2023*

- Added the ability to update a test case without version (TMS-570)
- Added restore of test case from any version (TMS-585)
- Added link to comment for test result (TMS-563)
- Child test plan creation disabled for archived plan (TMS-578)
- Added direct link to the test result (TMS-510)
- Added `remember me` flag for authorization (TMS-351)
- Frontend build optimization
- Test case search optimization
- Added markdown support for test plan description

Version 1.2.11
--------------
*Status: Internal*

*Released: 03-11-2023*

- Added test case archiving (TMS-498)
- Storing `estimate` option for test plan (TMS-560)
- Added labels for test plan histogram (TMS-548)
- Drawer optimization

Version 1.2.10
--------------
*Status: Internal*

*Released: 25-10-2023*

- Added sorting by name for test case table (TMS-507)
- Added clickable links for markdown (TMS-529)
- Added negative lables for test plan (TMS-526)
- Added comments, tests and history for test case

Version 1.2.9
-------------
*Status: Internal*

*Released: 17-10-2023*

- Added test plan statistics by `estimate` field (TMS-524)
- User list server pagination (TMS-357)
- Added avatar column

Version 1.2.8
-------------
*Status: General Availability*

*Released: 11-10-2023*

- Added project icon (TMS-501)
- Added test case copying (TMS-522)
- Store date for every histogram (TMS-528)
- Added test suite copying (TMS-496)
- Test case search optimization
- Fixed history error for TestRail migration

Version 1.2.7
-------------
*Status: Internal*

*Released: 22-09-2023*

- Server pagination and test suite search (TMS-484)
- Added comments for test case and test result (TMS-482)
- Added user activity statistics

Version 1.2.6
-------------
*Status: Internal*

*Released: 19-09-2023*

- Added histogram for test plan (TMS-476)
- Added `Assing to me` button (TMS-489)
- System messages (TMS-492)
- Added `Under construction` page (TMS-493)
- Added test plan copying via CLI (TMS-485)
- Plugins removed from core
- Added user avatars for test and result

Version 1.2.5
-------------
*Status: Internal*

*Released: 07-09-2023*

- Server sorting for test cases (TMS-429)
- Test plan server pagination (TMS-394)
- Added drawer (TMS-179)
- Fixed list for markdown (TMS-430)
- Fixed slow authentication (TMS-463)
- Removed `Untested` status from test case steps

Version 1.2.4
-------------
*Status: Internal*

*Released: 03-08-2023*

- Added avatar for user profile (TMS-355)
- Removed `Untested` status for test case (TMS-427)

Version 1.2.3
-------------
*Status: Internal*

*Released: 28-07-2023*

- Added execution percent of root test plans (TMS-344)


Version 1.2.2
-------------
*Status: Internal*

*Released: 20-07-2023*

- Added safe models removing and test plan archiving (TMS-233)
- Added link to object for popup message (TMS-396)
- Added `assigned to` field for test (TMS-365)

Version 0.1.0 - 1.1.0
---------------------
*Internal releases under active development, 2022-2023*